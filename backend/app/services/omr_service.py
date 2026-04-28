import cv2
import numpy as np
import imutils
from imutils.perspective import four_point_transform

class OMRService:
    @staticmethod
    def process_omr_sheet(image_path, num_questions=40, num_options=4):
        """
        Kashmir University Precision Engine - K-Means Edition.
        Mathematically clusters bubbles into a 4x10 grid.
        """
        try:
            image = cv2.imread(image_path)
            if image is None: return {}
            
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
            gray = clahe.apply(gray)
            blurred = cv2.GaussianBlur(gray, (3, 3), 0)
            thresh = cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 31, 10)

            cnts = cv2.findContours(thresh.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            cnts = imutils.grab_contours(cnts)
            
            all_bubbles = []
            height, width = thresh.shape
            
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

            # MCQ section targeting
            mcq_candidates = [p for p in all_bubbles if p["y"] > (height * 0.45)]
            print(f"DEBUG: Processing {len(mcq_candidates)} MCQ bubbles")
            if len(mcq_candidates) < 10: return {}

            # 1. CLUSTER INTO 4 COLUMNS (X-Clustering)
            x_coords = np.array([p["x"] for p in mcq_candidates], dtype=np.float32)
            # Define criteria and apply kmeans()
            criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 10, 1.0)
            _, labels, centers = cv2.kmeans(x_coords, 4, None, criteria, 10, cv2.KMEANS_PP_CENTERS)
            
            # Sort centers left-to-right
            sorted_centers = sorted(centers.flatten())
            columns = [[] for _ in range(4)]
            
            for i, p in enumerate(mcq_candidates):
                # Find which sorted center this point belongs to
                dist = [abs(p["x"] - c) for c in sorted_centers]
                col_idx = np.argmin(dist)
                columns[col_idx].append(p)

            results = {}
            options = ["A", "B", "C", "D", "E"]
            
            # 2. PROCESS EACH COLUMN INTO 10 ROWS (Y-Clustering)
            for c_idx, col in enumerate(columns):
                if not col: continue
                col_start_q = (c_idx * 10) + 1
                
                y_coords = np.array([p["y"] for p in col], dtype=np.float32)
                # Cluster into 10 rows per column
                _, y_labels, y_centers = cv2.kmeans(y_coords, 10, None, criteria, 10, cv2.KMEANS_PP_CENTERS)
                
                # Sort row centers top-to-bottom
                sorted_y_centers = sorted(y_centers.flatten())
                rows = [[] for _ in range(10)]
                
                for i, p in enumerate(col):
                    dist = [abs(p["y"] - cy) for cy in sorted_y_centers]
                    row_idx = np.argmin(dist)
                    rows[row_idx].append(p)
                
                print(f"  Col {c_idx+1}: Successfully clustered into 10 math rows.")

                for r_idx, row in enumerate(rows):
                    q_num = col_start_q + r_idx
                    if q_num > num_questions: break
                    
                    row.sort(key=lambda p: p["x"])
                    scores = []
                    for p in row:
                        mask = np.zeros(thresh.shape, dtype="uint8")
                        cv2.drawContours(mask, [p["c"]], -1, 255, -1)
                        total = cv2.countNonZero(cv2.bitwise_and(thresh, thresh, mask=mask))
                        scores.append(total)
                    
                    if not scores: 
                        results[str(q_num)] = "-"
                        continue
                        
                    best_idx = np.argmax(scores)
                    # 15% fill threshold
                    if scores[best_idx] > (row[best_idx]["w"] * row[best_idx]["h"] * 0.15):
                        results[str(q_num)] = options[best_idx if best_idx < len(options) else 0]
                    else:
                        results[str(q_num)] = "-"

            print(f"Final extracted answers: {results}")
            return results

        except Exception as e:
            print(f"OMR Error: {e}")
            import traceback
            traceback.print_exc()
            return {}
