# Zipf's Law Analyzer

A simple web application to test whether a text follows **Zipf's Law**.

Users can paste text or upload a `.txt` file, then visualize word frequencies with a chart and ranked table.

---

## Features

- Upload `.txt` files
- Paste custom text
- Word frequency analysis
- Interactive chart
- Logarithmic / linear scale toggle
- Zipf coefficient calculation
- Top ranked words table

---

## Technologies

- HTML
- CSS
- JavaScript
- Chart.js
- MathJax

---

## How to Use

1. Open `index.html`
2. Paste text or upload a `.txt` file
3. Click **Analyze**
4. View the chart and results table

---

## Run Locally

You can open the file directly in your browser:

```text
index.html
```

Or start a local server:

```bash
python3 -m http.server
```

Then open:

```text
http://localhost:8000
```

---

## About Zipf's Law

Zipf's Law states that the frequency of a word is inversely proportional to its rank:

\[
f(r) = \frac{1}{r^s}
\]

This behavior appears in many natural language texts.

---

## Limits

- Maximum: 10,000 words
- Only `.txt` files supported

---

## License

Free to use for educational and research purposes.
