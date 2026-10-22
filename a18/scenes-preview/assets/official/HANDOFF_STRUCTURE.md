# A18 Structure handoff

Canonical GitHub source: a18/scenes-preview/assets/official/
Mirror on Google Drive: A18_パズル美術館/00_正式採用素材/
characters/: 48 PNG, user-approved; male 20, female 20, staff 4, butler 4.
furniture/: 24 extracted transparent PNG candidates, not approved; QA_contact.png, manifest.json.
IMPORTANT: furniture contains visible extraction artifacts (e.g. some remnants of captions, chandelier segmentation, incomplete column). Do not ship until individual visual correction and game-size QA.
Main scenes-preview/index.html uses official/characters. Old asset paths retained for other running layout-test dependencies; do not delete until dependency migration.
Structure implementation should use furniture filenames from manifest, determine wall vs floor anchors, frame photo openings, placement collision and phone display.
No iOS build or App Store submission performed.
