import cv2
import numpy as np
import imutils
from imutils.perspective import four_point_transform

class OMRService:
    @staticmethod
    def process_omr_sheet(image_path, num_questions=40, num_options=4):
        """
        State-of-the-art OMR detection using spatial density clustering.
        Designed for complex university sheets with high bubble density.
        """
        try:
            image = cv2.imread(image_path)
            if image is None: return {}
            
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            blurred = cv2.GaussianBlur(gray, (5, 5), 0)
            thresh = cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 11, 2)

            # 1. Find all potential bubble centroids
            cnts = cv2.findContours(thresh.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            cnts = imutils.grab_contours(cnts)
            
            points = []
            for c in cnts:
                (x, y, w, h) = cv2.boundingRect(c)
                ar = w / float(h)
                if 5 <= w <= 60 and 5 <= h <= 60 and 0.6 <= ar <= 1.4:
                    area = cv2.contourArea(c)
                    if area > 20: # Minimum area to ignore noise
                        M = cv2.moments(c)
                        if M["m00"] != 0:
                            cX = int(M["m10"] / M["m00"])
                            cY = int(M["m01"] / M["m00"])
                            points.append({"x": cX, "y": cY, "w": w, "h": h, "c": c})

            print(f"Total valid bubble candidates: {len(points)}")
            if len(points) < 15: return {}

            # 2. Cluster into 4 vertical columns using X-coordinates
            # We sort by X and find the natural gaps
            points.sort(key=lambda p: p["x"])
            columns = []
            if points:
                curr_col = [points[0]]
                for i in range(1, len(points)):
                    # A gap > 50px between bubbles in a row is likely a column break
                    # But the gap between columns is much larger. 
                    # We use a median-based gap detection.
                    if points[i]["x"] - points[i-1]["x"] < 100:
                        curr_col.append(points[i])
                    else:
                        if len(curr_col) >= 10: columns.append(curr_col)
                        curr_col = [points[i]]
                if len(curr_col) >= 10: columns.append(curr_col)

            print(f"Detected {len(columns)} columns.")

            # 3. Process each column to find rows
            results = {}
            global_q_idx = 1
            options = ["A", "B", "C", "D", "E"]

            for c_idx, col in enumerate(columns):
                # Sort this column by Y
                col.sort(key=lambda p: p["y"])
                print(f"  Col {c_idx+1}: {len(col)} points")
                
                # Group into rows based on Y proximity
                rows = []
                if not col: continue
                
                curr_row = [col[0]]
                for i in range(1, len(col)):
                    # Strict Y-proximity for rows within a column (15px)
                    if col[i]["y"] - col[i-1]["y"] < 15:
                        curr_row.append(col[i])
                    else:
                        # Before closing a row, check if it's too large (more than 5 bubbles)
                        # This prevents lumping multiple questions together
                        if len(curr_row) > 6:
                            # Split giant row into chunks of options
                            for k in range(0, len(curr_row), 4):
                                sub_row = curr_row[k:k+4]
                                if len(sub_row) >= 2: rows.append(sub_row)
                        elif len(curr_row) >= 2:
                            rows.append(curr_row)
                        curr_row = [col[i]]
                
                # Final row handling
                if len(curr_row) >= 2: rows.append(curr_row)
                
                print(f"  Col {c_idx+1}: {len(rows)} questions found.")

                for row in rows:
                    if global_q_idx > num_questions: break
                    row.sort(key=lambda p: p["x"])
                    
                    # Score each bubble
                    scores = []
                    for p in row:
                        mask = np.zeros(thresh.shape, dtype="uint8")
                        cv2.drawContours(mask, [p["c"]], -1, 255, -1)
                        total = cv2.countNonZero(cv2.bitwise_and(thresh, thresh, mask=mask))
                        scores.append(total)
                    
                    best_idx = np.argmax(scores)
                    if scores[best_idx] > (row[best_idx]["w"] * row[best_idx]["h"] * 0.35):
                        results[str(global_q_idx)] = options[best_idx if best_idx < len(options) else 0]
                    else:
                        results[str(global_q_idx)] = "-"
                    global_q_idx += 1

            return results

        except Exception as e:
            print(f"OMR Critical Error: {e}")
            import traceback
            traceback.print_exc()
            return {}
