import cv2
import numpy as np
import imutils

class OMRService:
    @staticmethod
    def process_omr_sheet(image_path, num_questions=40, num_options=4):
        """
        Kashmir University OMR - Restored Working Engine + Accuracy Fixes.
        Uses bottom-half isolation + pure 4-column K-Means (proven to find 98 bubbles).
        """
        try:
            image = cv2.imread(image_path)
            if image is None:
                return {}

            # Resize for consistent contour filtering
            image = imutils.resize(image, width=800)
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

            # --- Pass 1: Detection (Find the empty bubble rings) ---
            blurred = cv2.GaussianBlur(gray, (3, 3), 0)
            thresh_contours = cv2.adaptiveThreshold(
                blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 31, 10
            )

            # --- Pass 2: Scoring (Image Subtraction for pencil marks) ---
            # Create a heavily blurred background approximation
            blur_bg = cv2.GaussianBlur(gray, (85, 85), 0)
            # Subtract original from background. Dark pencil marks become bright white.
            subtracted = cv2.subtract(blur_bg, gray)
            # Threshold the subtracted image to isolate the filled regions
            _, thresh_score = cv2.threshold(subtracted, 40, 255, cv2.THRESH_BINARY)

            height, width = thresh_contours.shape

            # ── Detect all bubble candidates ───────────────────────────────────
            cnts = cv2.findContours(thresh_contours.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            cnts = imutils.grab_contours(cnts)

            all_bubbles = []
            for c in cnts:
                (x, y, w, h) = cv2.boundingRect(c)
                ar = w / float(h)
                if 5 <= w <= 60 and 5 <= h <= 60 and 0.5 <= ar <= 1.5:
                    if cv2.contourArea(c) > 15:
                        M = cv2.moments(c)
                        if M["m00"] != 0:
                            all_bubbles.append({
                                "x": int(M["m10"] / M["m00"]),
                                "y": int(M["m01"] / M["m00"]),
                                "w": w, "h": h, "c": c
                            })

            # Target bottom 45% where the MCQ table lives.
            # Use an absolute left-edge cutoff (70px) to remove binding noise.
            # No right-side filter — MCQ bubbles can be near the right edge.
            mcq = [
                p for p in all_bubbles
                if p["y"] > height * 0.45
                and p["x"] > 70
            ]
            print(f"DEBUG: MCQ candidates = {len(mcq)}")
            if len(mcq) < 20:
                return {}

            # ── Step 1: K-Means into 4 columns ────────────────────────────────
            criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 30, 1.0)
            x_arr = np.array([p["x"] for p in mcq], dtype=np.float32)
            _, col_labels, col_centers = cv2.kmeans(
                x_arr, 4, None, criteria, 20, cv2.KMEANS_PP_CENTERS
            )

            # col_labels is shape (N,1) — flatten to (N,) for safe indexing
            col_labels_flat = col_labels.flatten()

            # Sort columns left → right by their center X
            order = sorted(range(4), key=lambda i: col_centers[i][0])
            col_label_map = {order[i]: i for i in range(4)}
            columns = [[] for _ in range(4)]
            for i, p in enumerate(mcq):
                columns[col_label_map[int(col_labels_flat[i])]].append(p)

            print(f"DEBUG: Column sizes = {[len(c) for c in columns]}")

            options = ["A", "B", "C", "D"]
            results = {}

            for c_idx, col in enumerate(columns):
                col_start_q = c_idx * 10 + 1
                if len(col) < 8:
                    print(f"  Col {c_idx+1}: too sparse, skipping.")
                    continue

                try:
                    # ── Step 2: Find 5 vertical tracks per column ──────────────
                    # Kashmir sheet: [Q_no | A | B | C | D]
                    col_x = np.array([p["x"] for p in col], dtype=np.float32)
                    k_x = min(5, len(set(int(v) for v in col_x)))
                    _, _, tx = cv2.kmeans(col_x, k_x, None, criteria, 20, cv2.KMEANS_PP_CENTERS)
                    sorted_tracks = sorted(tx.flatten())
                    # If 5 tracks found → skip first (Q number). Else use all as options.
                    option_tracks = sorted_tracks[1:] if k_x == 5 else sorted_tracks

                    # ── Step 3: K-Means into 10 question rows ─────────────────
                    col_y = np.array([p["y"] for p in col], dtype=np.float32)
                    k_y = min(10, len(set(int(v) for v in col_y)))
                    _, _, ty = cv2.kmeans(col_y, k_y, None, criteria, 20, cv2.KMEANS_PP_CENTERS)
                    sorted_rows = sorted(ty.flatten())

                    # Assign bubbles to rows
                    rows = [[] for _ in range(len(sorted_rows))]
                    for p in col:
                        dy = [abs(p["y"] - ry) for ry in sorted_rows]
                        rows[int(np.argmin(dy))].append(p)

                    print(f"  Col {c_idx+1} (Q{col_start_q}): {len(rows)} rows | tracks={[round(t) for t in option_tracks]}")

                    for r_idx, row in enumerate(rows):
                        q_num = col_start_q + r_idx
                        if q_num > num_questions:
                            break

                        # Match each option track to closest bubble in the row
                        option_bubbles = []
                        for tx_val in option_tracks:
                            best_p, best_d = None, 50
                            for p in row:
                                d = abs(p["x"] - tx_val)
                                if d < best_d:
                                    best_d, best_p = d, p
                            option_bubbles.append(best_p)

                        # Score by fill density using Image Subtraction
                        scores = []
                        for p in option_bubbles:
                            if p is None:
                                scores.append(0)
                                continue
                            
                            # Extract bounding box of the bubble
                            bx, by, bw, bh = cv2.boundingRect(p["c"])
                            
                            # Shrink ROI by 25% on all sides to focus STRICTLY on the inner fill
                            # This completely ignores the printed dark ring of the bubble
                            margin_x = int(bw * 0.25)
                            margin_y = int(bh * 0.25)
                            
                            roi = thresh_score[by + margin_y : by + bh - margin_y, 
                                               bx + margin_x : bx + bw - margin_x]
                            
                            scores.append(cv2.countNonZero(roi))

                        if not scores:
                            results[str(q_num)] = "-"
                            continue

                        best_idx = int(np.argmax(scores))
                        max_score = scores[best_idx]

                        # Since we are using inner-ROI on a subtracted background, 
                        # an empty bubble has ~0 pixels. A filled one has many.
                        # 10 pixels is a safe noise floor for a 800px wide image.
                        if max_score > 10:
                            results[str(q_num)] = options[min(best_idx, 3)]
                        else:
                            results[str(q_num)] = "-"

                except Exception as col_err:
                    print(f"  Col {c_idx+1} error: {col_err}")
                    import traceback; traceback.print_exc()
                    continue

            print(f"Final extracted answers: {results}")
            return results

        except Exception as e:
            print(f"OMR Critical Error: {e}")
            import traceback; traceback.print_exc()
            return {}
