# MOMENT — Sunny’s Peaceful Fishing

Start the complete paired-device experience with:

```bash
npm start
```

Open the printed **Phone-ready address** on the large screen. Both devices must be on the same Wi-Fi network. Choosing “Go fishing” creates a four-character session and a scannable QR code. The phone opens `/controller?session=XXXX` and connects automatically.

For a judge demo, allow about two minutes: connect, complete the four gentle practice movements, catch the Golden Lotus Fish, share one memory, and view the daily report.

## AI companion

Set the API key only in the server terminal. It is never sent to the browser:

```bash
export OPENAI_API_KEY="your-key"
export OPENAI_MODEL="gpt-5.6-sol" # optional; this is already the server default
npm start
```

Without a key, MOMENT uses warm built-in fallback responses so the demo still completes.

Talk includes **Tell me about this photo**. The chosen photo is sent only for that live request and is not written to the profile or reports. Only words the resident chooses to share afterward can become a remembered note.

## Test phone motion on HTTPS

iPhone Safari requires HTTPS for motion sensors and asks for permission only after a button tap. In a second terminal run:

```bash
npm run tunnel
```

Open the HTTPS ngrok address on the large screen, scan its QR code, then tap **Allow motion & begin** on the phone and choose **Allow**. Add `?debug=1` to the controller URL to show live beta, gamma, rotation and detected-motion values alongside x/y/z.

## Persistent HTTPS deployment

GitHub Pages can show the static preview, but it cannot run MOMENT's two-device session API. For a persistent QR/controller demo, deploy this folder as a Node web service using `render.yaml`, then open the Render HTTPS URL on the large screen. The generated QR code will use the same HTTPS host, which allows iPhone Motion & Orientation permission and keeps controller events synchronized with the display.
