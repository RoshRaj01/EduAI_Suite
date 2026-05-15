"""
Computational OMR Grading Engine
Pure OpenCV + NumPy pipeline — zero AI dependencies.

Combines techniques from:
- omr-lite's BubbleSheetProcessor (ROI-based, contour+circularity, uncertainty)
- Original KMeans auto-detection (column/row clustering for printed forms)
"""
import logging
import traceback

import cv2
import imutils
import numpy as np

logger = logging.getLogger(__name__)


class OMRService:
    """
    Stateless OMR processing service.

    Two strategies:
      1. ROI-based  — caller supplies ROI rectangles for each question's choices
      2. Auto-detect — KMeans column/row clustering (legacy Kashmir-University layout)

    Both share the same fill-analysis and uncertainty logic.
    """

    # ── Strategy 1: ROI-based grading (ported from omr-lite) ────────────

    @staticmethod
    def process_with_roi(
        image_path: str,
        roi_configs: list,
        answer_key: dict | None = None,
        min_pixel_threshold: int = 300,
        uncertainty_margin: int = 50,
    ) -> dict:
        """
        Grade an OMR sheet using explicit ROI rectangles.

        Args:
            image_path: path to the scanned image
            roi_configs: list-of-lists  [[( x,y,w,h ), …], …]
                         outer = questions, inner = choice boxes
            answer_key:  {"1": "A", "2": "C", …} or None
            min_pixel_threshold: minimum filled-pixel count to register a mark
            uncertainty_margin: if top-two fills differ by ≤ this → uncertain

        Returns:
            {
              "answers": {"1": "A", "2": "?", …},
              "uncertainties": [ {question, reason, fill_counts}, … ],
              "score": int,
              "total": int,
              "confidence": float,
            }
        """
        try:
            image = cv2.imread(image_path)
            if image is None:
                return {"error": "Failed to read image"}

            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            _, thresh = cv2.threshold(
                gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU
            )

            answers = {}
            uncertainties = []
            score = 0
            total = len(roi_configs)

            for q_idx, choices in enumerate(roi_configs):
                q_num = str(q_idx + 1)
                fill_counts = []

                for x, y, w, h in choices:
                    if y + h <= thresh.shape[0] and x + w <= thresh.shape[1]:
                        roi = thresh[y : y + h, x : x + w]
                        fill_counts.append(int(cv2.countNonZero(roi)))
                    else:
                        fill_counts.append(0)

                if not fill_counts:
                    answers[q_num] = "?"
                    uncertainties.append(
                        {"question": q_num, "reason": "No ROI data", "fill_counts": []}
                    )
                    continue

                max_fill = max(fill_counts)
                selected_idx = fill_counts.index(max_fill)

                if max_fill < min_pixel_threshold:
                    answers[q_num] = "?"
                    uncertainties.append(
                        {
                            "question": q_num,
                            "reason": "No significant fill detected",
                            "fill_counts": fill_counts,
                        }
                    )
                else:
                    sorted_fills = sorted(fill_counts, reverse=True)
                    second_max = sorted_fills[1] if len(sorted_fills) > 1 else 0
                    diff = max_fill - second_max

                    if diff <= uncertainty_margin:
                        answers[q_num] = "?"
                        uncertainties.append(
                            {
                                "question": q_num,
                                "reason": "Multiple bubbles filled",
                                "fill_counts": fill_counts,
                            }
                        )
                    else:
                        answers[q_num] = chr(65 + selected_idx)

                # Score against key
                if answer_key and q_num in answer_key:
                    if answers[q_num] == answer_key[q_num]:
                        score += 1

            answered = sum(1 for v in answers.values() if v != "?")
            confidence = answered / total if total > 0 else 0.0

            return {
                "answers": answers,
                "uncertainties": uncertainties,
                "score": score,
                "total": total,
                "confidence": round(confidence, 3),
            }

        except Exception as exc:
            logger.error(f"ROI OMR error: {exc}")
            traceback.print_exc()
            return {"error": str(exc)}

    # ── Strategy 2: Auto-detect via KMeans (original engine) ────────────

    @staticmethod
    def process_omr_sheet(
        image_path: str,
        num_questions: int = 40,
        num_options: int = 4,
        min_pixel_threshold: int = 20,
        uncertainty_margin: int = 0,
    ) -> dict:
        """
        Auto-detect OMR layout using KMeans clustering.

        Designed for printed OMR forms with a regular grid of bubbles.
        Uses image-subtraction scoring (blur_bg − original) for robust
        pencil-mark detection on pre-printed forms with dark bubble rings.

        Args:
            image_path: path to scanned image
            num_questions: maximum questions to extract
            num_options: expected options per question (default 4: A-D)
            min_pixel_threshold: noise floor for fill detection
            uncertainty_margin: if >0, flag ambiguous marks as "?"

        Returns:
            When uncertainty_margin == 0 (legacy mode):
                {"1": "A", "2": "B", …}  (flat dict, backward-compatible)
            When uncertainty_margin > 0 (enhanced mode):
                {"answers": {…}, "uncertainties": […], "score": 0, "total": N, "confidence": float}
        """
        enhanced = uncertainty_margin > 0

        try:
            image = cv2.imread(image_path)
            if image is None:
                return {} if not enhanced else {"error": "Failed to read image"}

            image = imutils.resize(image, width=800)
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

            # Pass 1: Detection — adaptive threshold to find bubble rings
            blurred = cv2.GaussianBlur(gray, (3, 3), 0)
            thresh_contours = cv2.adaptiveThreshold(
                blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                cv2.THRESH_BINARY_INV, 31, 10,
            )

            # Pass 2: Scoring — image subtraction isolates pencil marks
            blur_bg = cv2.GaussianBlur(gray, (85, 85), 0)
            subtracted = cv2.subtract(blur_bg, gray)
            _, thresh_score = cv2.threshold(subtracted, 40, 255, cv2.THRESH_BINARY)

            height, width = thresh_contours.shape

            # ── Find bubble candidates ──
            cnts = cv2.findContours(
                thresh_contours.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE,
            )
            cnts = imutils.grab_contours(cnts)

            all_bubbles = []
            for c in cnts:
                x, y, w, h = cv2.boundingRect(c)
                ar = w / float(h)
                if 5 <= w <= 60 and 5 <= h <= 60 and 0.5 <= ar <= 1.5:
                    area = cv2.contourArea(c)
                    if area > 15:
                        # Circularity filter (ported from omr-lite)
                        perimeter = cv2.arcLength(c, True)
                        circularity = (
                            4 * np.pi * area / (perimeter * perimeter)
                            if perimeter > 0
                            else 0
                        )
                        if circularity > 0.25:
                            M = cv2.moments(c)
                            if M["m00"] != 0:
                                all_bubbles.append(
                                    {
                                        "x": int(M["m10"] / M["m00"]),
                                        "y": int(M["m01"] / M["m00"]),
                                        "w": w, "h": h, "c": c,
                                    }
                                )

            # Bottom 55 % of the page (MCQ region)
            mcq = [
                p for p in all_bubbles
                if p["y"] > height * 0.55
                and 20 < p["x"] < width - 20
            ]

            if len(mcq) < 20:
                # ── Fallback: grid-based sampling (ported from omr-lite) ──
                return OMRService._fallback_grid_detection(
                    thresh_score, height, width, num_questions,
                    num_options, min_pixel_threshold, uncertainty_margin, enhanced,
                )

            # ── KMeans into columns ──
            criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 30, 1.0)
            num_cols = num_options  # typically 4
            x_arr = np.array([p["x"] for p in mcq], dtype=np.float32)

            unique_x = len(set(int(v) for v in x_arr))
            if unique_x < num_cols:
                return {} if not enhanced else {"error": "Not enough column data"}

            _, col_labels, col_centers = cv2.kmeans(
                x_arr, num_cols, None, criteria, 20, cv2.KMEANS_PP_CENTERS,
            )
            col_labels_flat = col_labels.flatten()
            order = sorted(range(num_cols), key=lambda i: col_centers[i][0])
            col_label_map = {order[i]: i for i in range(num_cols)}
            columns = [[] for _ in range(num_cols)]
            for i, p in enumerate(mcq):
                columns[col_label_map[int(col_labels_flat[i])]].append(p)

            options = [chr(65 + i) for i in range(num_options)]
            results = {}
            uncertainties_list = []

            for c_idx, col in enumerate(columns):
                col_start_q = c_idx * 10 + 1
                if len(col) < 8:
                    continue

                try:
                    col_x = np.array([p["x"] for p in col], dtype=np.float32)
                    k_x = min(num_options, len(set(int(v) for v in col_x)))
                    if k_x < num_options:
                        continue

                    _, _, tx = cv2.kmeans(
                        col_x, num_options, None, criteria, 20, cv2.KMEANS_PP_CENTERS,
                    )
                    option_tracks = sorted(tx.flatten())

                    col_y = np.array([p["y"] for p in col], dtype=np.float32)
                    k_y = min(10, len(set(int(v) for v in col_y)))
                    _, _, ty = cv2.kmeans(
                        col_y, k_y, None, criteria, 20, cv2.KMEANS_PP_CENTERS,
                    )
                    sorted_rows = sorted(ty.flatten())

                    rows = [[] for _ in range(len(sorted_rows))]
                    for p in col:
                        dy = [abs(p["y"] - ry) for ry in sorted_rows]
                        rows[int(np.argmin(dy))].append(p)

                    for r_idx, row in enumerate(rows):
                        q_num = col_start_q + r_idx
                        if q_num > num_questions:
                            break

                        option_bubbles = []
                        for tx_val in option_tracks:
                            best_p, best_d = None, 50
                            for p in row:
                                d = abs(p["x"] - tx_val)
                                if d < best_d:
                                    best_d, best_p = d, p
                            option_bubbles.append(best_p)

                        scores = []
                        for p in option_bubbles:
                            if p is None:
                                scores.append(0)
                                continue
                            bx, by, bw, bh = cv2.boundingRect(p["c"])
                            mx = int(bw * 0.25)
                            my = int(bh * 0.25)
                            roi = thresh_score[
                                by + my : by + bh - my,
                                bx + mx : bx + bw - mx,
                            ]
                            scores.append(int(cv2.countNonZero(roi)))

                        q_key = str(q_num)
                        if not scores:
                            results[q_key] = "-"
                            continue

                        best_idx = int(np.argmax(scores))
                        max_score = scores[best_idx]

                        if max_score <= min_pixel_threshold:
                            results[q_key] = "-" if not enhanced else "?"
                            if enhanced:
                                uncertainties_list.append({
                                    "question": q_key,
                                    "reason": "No significant fill detected",
                                    "fill_counts": scores,
                                })
                        elif enhanced and uncertainty_margin > 0:
                            sorted_scores = sorted(scores, reverse=True)
                            second = sorted_scores[1] if len(sorted_scores) > 1 else 0
                            if max_score - second <= uncertainty_margin:
                                results[q_key] = "?"
                                uncertainties_list.append({
                                    "question": q_key,
                                    "reason": "Multiple bubbles filled",
                                    "fill_counts": scores,
                                })
                            else:
                                results[q_key] = options[min(best_idx, num_options - 1)]
                        else:
                            results[q_key] = options[min(best_idx, num_options - 1)]

                except Exception as col_err:
                    logger.warning(f"Column {c_idx + 1} error: {col_err}")
                    continue

            if not enhanced:
                return results

            answered = sum(1 for v in results.values() if v not in ("?", "-"))
            total = len(results)
            return {
                "answers": results,
                "uncertainties": uncertainties_list,
                "score": 0,
                "total": total,
                "confidence": round(answered / total, 3) if total else 0.0,
            }

        except Exception as e:
            logger.error(f"OMR Critical Error: {e}")
            traceback.print_exc()
            return {} if not enhanced else {"error": str(e)}

    # ── Fallback: grid-based sampling ───────────────────────────────────

    @staticmethod
    def _fallback_grid_detection(
        thresh_score, height, width,
        num_questions, num_options,
        min_pixel_threshold, uncertainty_margin, enhanced,
    ) -> dict:
        """
        When contour detection finds too few bubbles, fall back to a
        uniform grid overlay and sample fill density at each cell center.
        Ported from omr-lite's _fallback_grid_detection_with_threshold.
        """
        # Assume MCQ region occupies bottom 45 % of the page
        mcq_top = int(height * 0.55)
        mcq_h = height - mcq_top
        margin_x = 20

        cols_per_group = num_options
        num_col_groups = max(1, num_questions // 10)
        group_width = (width - 2 * margin_x) / num_col_groups
        rows_per_group = min(10, num_questions)

        cell_h = mcq_h / rows_per_group

        results = {}
        uncertainties_list = []

        for g in range(num_col_groups):
            gx = margin_x + g * group_width
            cell_w = group_width / cols_per_group

            for r in range(rows_per_group):
                q_num = g * 10 + r + 1
                if q_num > num_questions:
                    break

                scores = []
                for c in range(cols_per_group):
                    cx = int(gx + c * cell_w + cell_w / 2)
                    cy = int(mcq_top + r * cell_h + cell_h / 2)
                    sample_r = int(min(cell_w, cell_h) * 0.25)

                    x1 = max(0, cx - sample_r)
                    y1 = max(0, cy - sample_r)
                    x2 = min(width, cx + sample_r)
                    y2 = min(height, cy + sample_r)

                    if x2 > x1 and y2 > y1:
                        roi = thresh_score[y1:y2, x1:x2]
                        scores.append(int(cv2.countNonZero(roi)))
                    else:
                        scores.append(0)

                q_key = str(q_num)
                if not scores or max(scores) <= min_pixel_threshold:
                    results[q_key] = "-" if not enhanced else "?"
                    if enhanced:
                        uncertainties_list.append({
                            "question": q_key,
                            "reason": "No significant fill detected",
                            "fill_counts": scores,
                        })
                else:
                    best_idx = int(np.argmax(scores))
                    results[q_key] = chr(65 + min(best_idx, num_options - 1))

        if not enhanced:
            return results

        answered = sum(1 for v in results.values() if v not in ("?", "-"))
        total = len(results)
        return {
            "answers": results,
            "uncertainties": uncertainties_list,
            "score": 0,
            "total": total,
            "confidence": round(answered / total, 3) if total else 0.0,
        }

    # ── Image Alignment (ORB + Homography) ──────────────────────────────

    @staticmethod
    def align_to_template(scan_image, template_image):
        """
        Align a scanned sheet to a template using ORB keypoints + homography.
        Ported from omr-lite's align_images().

        Returns the warped image, or None if alignment fails.
        """
        try:
            gray1 = cv2.cvtColor(scan_image, cv2.COLOR_BGR2GRAY)
            gray2 = cv2.cvtColor(template_image, cv2.COLOR_BGR2GRAY)

            orb = cv2.ORB_create(5000)
            kp1, des1 = orb.detectAndCompute(gray1, None)
            kp2, des2 = orb.detectAndCompute(gray2, None)

            if des1 is None or des2 is None:
                return None

            matcher = cv2.DescriptorMatcher_create(
                cv2.DESCRIPTOR_MATCHER_BRUTEFORCE_HAMMING
            )
            matches = sorted(matcher.match(des1, des2), key=lambda m: m.distance)
            good = matches[: max(4, int(len(matches) * 0.15))]

            if len(good) < 4:
                return None

            pts1 = np.float32([kp1[m.queryIdx].pt for m in good])
            pts2 = np.float32([kp2[m.trainIdx].pt for m in good])

            H, _ = cv2.findHomography(pts1, pts2, cv2.RANSAC)
            if H is None:
                return None

            h, w = template_image.shape[:2]
            return cv2.warpPerspective(
                scan_image, H, (w, h),
                flags=cv2.INTER_LANCZOS4,
                borderMode=cv2.BORDER_CONSTANT,
                borderValue=(255, 255, 255),
            )
        except Exception:
            return None

    # ── Visualization ───────────────────────────────────────────────────

    @staticmethod
    def generate_visualization(image_path, roi_configs, answers, answer_key=None):
        """
        Draw color-coded circles on bubbles:
          green = correct / selected (no key),
          red = wrong,
          yellow = uncertain,
          gray = not selected.

        Returns the annotated image (numpy array) or None.
        """
        image = cv2.imread(image_path)
        if image is None:
            return None

        for q_idx, choices in enumerate(roi_configs):
            q_num = str(q_idx + 1)
            student_ans = answers.get(q_num, "-")
            correct_ans = answer_key.get(q_num) if answer_key else None

            for c_idx, (x, y, w, h) in enumerate(choices):
                center = (x + w // 2, y + h // 2)
                radius = min(w, h) // 3
                option_letter = chr(65 + c_idx)

                if student_ans == "?":
                    color = (0, 215, 255)  # Yellow — uncertain
                elif student_ans == option_letter:
                    if correct_ans is None or student_ans == correct_ans:
                        color = (0, 200, 0)  # Green
                    else:
                        color = (0, 0, 220)  # Red — wrong
                else:
                    color = (200, 200, 200)  # Gray

                cv2.circle(image, center, radius, color, 2)

        return image

    # ── PDF → Images ────────────────────────────────────────────────────

    @staticmethod
    def extract_pages_from_pdf(pdf_bytes, rotation=0, auto_align=True):
        """
        Convert each PDF page to a BGR numpy image.
        Optionally align all pages to the first page.

        Requires PyMuPDF (fitz).
        """
        try:
            import fitz
        except ImportError:
            logger.error("PyMuPDF not installed — pip install PyMuPDF")
            return []

        try:
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            images = []

            for page_num in range(len(doc)):
                page = doc[page_num]
                if rotation:
                    page.set_rotation(rotation)

                pix = page.get_pixmap(matrix=fitz.Matrix(5, 5))
                img = np.frombuffer(pix.samples, dtype=np.uint8).reshape(
                    pix.height, pix.width, pix.n
                )

                if pix.n == 4:
                    img = cv2.cvtColor(img, cv2.COLOR_RGBA2BGR)
                elif pix.n == 1:
                    img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)

                images.append(img)

            doc.close()

            if auto_align and len(images) > 1:
                ref = images[0]
                for i in range(1, len(images)):
                    aligned = OMRService.align_to_template(images[i], ref)
                    if aligned is not None:
                        images[i] = aligned

            return images

        except Exception as exc:
            logger.error(f"PDF extraction error: {exc}")
            return []
