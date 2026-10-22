# Web tools preview (GitHub Pages)
This repository contains **static browser preview snapshots** of three independently developed HTML5/Capacitor apps. It is separate from all iOS release repositories.
- /coin-jar/ from coin-jar-500/www
- /myprof/ from watashi-nenpyo/www
- /wish-note/ from a16-wish-note/www

To refresh only the public files after explicitly reviewing the new source snapshots, run `node build-preview.mjs` and inspect the diff before committing.
The preview does not provide Apple IAP, native AdMob or native notifications.
GitHub Pages is public: do not commit app source, build credentials, user data, development docs or local test records.
Public preview files include a noindex hint, not access control.
