# A18 next-stage implementation notes

1. Do not overwrite current male curator assets in scenes-preview/assets; keep as default.
2. Copy female sprites from curator_female to a dedicated new sprites directory, preserving front/back/left/right 00..04.
3. The original script SPRITE_BOUNDS is hardcoded for the male source; new female PNGs need the supplied alpha_bbox per frame in asset_manifest.json. Otherwise hair/feet will be cropped.
4. The browser walking QA used a copy of the original scenes-preview/index.html with only the 20 image paths and their alpha bounding boxes swapped; moving with the real game walk() worked in all four directions. The original source remains untouched.
5. Current entrance NPC rendering crops staff behind a counter. Remove the counter mask only when the scene layout is updated; assets include full shoes, and you must draw NPCs from their alpha_bbox at the foot baseline to match the player scale.
6. Furniture comes with alpha bounding boxes and foot anchors. Placement rectangles and NPC reachability require the separate world-geometry / collision refactor. Wall frames must leave the photo opening transparent. 24 PNGs are available for layout work, but the collision shapes have not been implemented.
7. Source version: A18 character pack v1.1; pixel furniture v1.0 with original v0.3 functional frames and original bust. The previously mentioned independent v0.9 character ZIP was not found in provided Drive/Downloads/Temp directories.
8. On iPhone 12 check Safari performance, 4-direction animation, staff/full-body visibility, frame/photo crop, and small props; Chromium emulation is not a substitute for physical testing.
9. Existing main-branch game, GitHub Pages release, and iOS builds were not modified in this asset-production task.
