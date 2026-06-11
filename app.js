const MAX_WORDS = 10000;
const MAX_TABLE_RANKS = 10;
const MAX_CHART_RANKS = 50;
const STOP_WORDS = new Set([
  "the","a","an","and","or","but","in","on","at","to","for",
  "of","with","by","from","is","was","are","were","be","been",
  "being","have","has","had","do","does","did","will","would",
  "could","should","may","might","shall","that","this","these",
  "those","it","its","i","he","she","they","we","you","my","his",
  "her","their","our","your","as","if","not","no","so","up","out",
  "about","into","than","then","when","there","what","which","who"
]);

let useLogScale = true;
let zipfChart;
let fullRanked = [];
let tableExpanded = false;

function updateWordCount() {
  const inputEl = document.getElementById('inputText');
  let words = inputEl.value.trim().split(/\s+/).filter(Boolean);
  let count = words.length;

  if (count > MAX_WORDS) {
    words = words.slice(0, MAX_WORDS);
    inputEl.value = words.join(" ");
    count = MAX_WORDS;
  }

  document.getElementById('wordCount').textContent = `Words: ${count} / ${MAX_WORDS}`;
}

function analyzeText(text) {
  const hideStopWords = document.getElementById('stopWordsToggle').checked;

  const words = text
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .filter(w => !hideStopWords || !STOP_WORDS.has(w));

  const total = words.length;
  const freq = {};
  words.forEach(w => freq[w] = (freq[w] || 0) + 1);

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .map(([word, count], i) => ({
      word,
      freq: count,
      rank: i + 1,
      ratio: ((count / total) * 100).toFixed(2)
    }));
}

function zipfCoeff(data) {
  const logRanks = data.map(d => Math.log(d.rank));
  const logFreqs = data.map(d => Math.log(d.freq));
  const n = data.length;

  const meanX = logRanks.reduce((a, b) => a + b, 0) / n;
  const meanY = logFreqs.reduce((a, b) => a + b, 0) / n;

  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (logRanks[i] - meanX) * (logFreqs[i] - meanY);
    den += (logRanks[i] - meanX) ** 2;
  }
  return -(num / den);
}

function renderChart(ranked) {
  const ctx = document.getElementById('zipfChart').getContext('2d');
  const topWords = ranked.slice(0, MAX_CHART_RANKS);
  const dataPoints = topWords.map(r => ({ x: r.rank, y: r.freq, word: r.word }));
  const coeff = zipfCoeff(ranked).toFixed(2);
  if (zipfChart?.destroy) zipfChart.destroy();

zipfChart = new Chart(ctx, {
  type: 'line',
  data: {
    datasets: [
      {
        label: 'Data',
        data: dataPoints,
        borderColor: 'blue',
        backgroundColor: 'rgba(0,0,255,0.1)',
        tension: 0,
        pointRadius: 4,
        pointHoverRadius: 7,
        hitRadius: 10,
        showLine: true
      },
      {
        label: "Zipf's law (s=1)",
        data: dataPoints.map(p => ({
          x: p.x,
          y: dataPoints[0].y / p.x
        })),
        borderColor: 'rgba(255, 0, 0, 0.8)',
        borderDash: [6, 4],
        borderWidth: 1.5,
        pointRadius: 0,
        showLine: true,
        fill: false
      }
    ]
  },

  options: {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'nearest',
      intersect: false
    },

    onHover: (event, elements) => {
      event.native.target.style.cursor =
        elements.length ? 'pointer' : 'default';
    },

    animation: {
      duration: 800,
      easing: 'easeOutQuart'
    },

    plugins: {
      title: {
        display: true,
        text: [`s ≈ ${coeff}`],
        font: { size: 18 }
      },
      tooltip: {
        mode: 'nearest',
        intersect: false,
        callbacks: {
          label: (ctx) => {
            const d = ctx.raw;

            return d.word
              ? `Word: ${d.word}, Freq: ${d.y}`
              : `Ideal Zipf: ${d.y.toFixed(1)}`;
          }
        }
      },

      legend: {
        display: true,
        labels: {
          boxWidth: 20,
          font: { size: 12 }
        }
      }
    },

    scales: {
      x: {
        type: useLogScale ? 'logarithmic' : 'linear',
        title: { display: true, text: 'Rank' },
        min: 1,
        grid: { display: false }
      },
      y: {
        type: useLogScale ? 'logarithmic' : 'linear',
        title: { display: true, text: 'Frequency' },
        min: 1,
        grid: { display: false }
      }
    }
  }
});

  document.getElementById('scaleToggleBtn').style.display = 'inline-block';
  document.getElementById('downloadChartBtn').style.display = 'inline-block';
}

function toggleScale() {
  useLogScale = !useLogScale;
  if (zipfChart) {
    zipfChart.options.scales.x.type = useLogScale ? 'logarithmic' : 'linear';
    zipfChart.options.scales.y.type = useLogScale ? 'logarithmic' : 'linear';
    zipfChart.update();
  }
}

function renderTable(ranked) {
  const resultsEl = document.getElementById("results");
  resultsEl.innerHTML = "";

  const table = document.createElement("table");

  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  ["Rank", "Word", "Frequency", "Ratio"].forEach(text => {
    const th = document.createElement("th");
    th.textContent = text;
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  ranked.slice(0, tableExpanded ? ranked.length : MAX_TABLE_RANKS).forEach(r => {
    const row = document.createElement("tr");
    [r.rank, r.word, r.freq, r.ratio].forEach((val, i) => {
      const td = document.createElement("td");
      td.textContent = i === 3 ? val + '%' : val;  
      row.appendChild(td);
    });
    tbody.appendChild(row);
  });

  table.appendChild(tbody);
  resultsEl.appendChild(table);

  document.getElementById("expandTableBtn").style.display = "inline-block";
  document.getElementById("csvBtn").style.display = "inline-block";
}

function toggleTable() {
  tableExpanded = !tableExpanded;
  renderTable(fullRanked);
  document.getElementById("expandTableBtn").textContent = tableExpanded ? "Show less" : "View all rows";
}

function runAnalysis() {
  const text = document.getElementById("inputText").value.trim();
  if (!text) { alert("Enter some text or upload a file."); return; }

  tableExpanded = false;
  document.getElementById("expandTableBtn").textContent = "View all rows";

  fullRanked = analyzeText(text);
  renderChart(fullRanked);
  renderTable(fullRanked);
}

function downloadCSV() {
  const hideStopWords = document.getElementById('stopWordsToggle').checked;
  const rows = [["Rank", "Word", "Frequency", "Ratio"]];
  fullRanked.forEach(r => rows.push([r.rank, r.word, r.freq, r.ratio]));
  const csv = rows.map(r => r.join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = hideStopWords ? "zipf_results_no_stopwords.csv" : "zipf_results.csv";
  a.click();
}

function downloadChart() {
  const a = document.createElement("a");
  a.href = document.getElementById("zipfChart").toDataURL("image/png");
  a.download = "zipf_chart.png";
  a.click();
}

function uploadFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (file.type !== "text/plain") {
    alert("Only .txt files are allowed.");
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    let content = e.target.result;
    let words = content.split(/\s+/);

    if (words.length > MAX_WORDS) {
      alert(`File exceeds ${MAX_WORDS} words. Only the first ${MAX_WORDS} words will be used.`);
      content = words.slice(0, MAX_WORDS).join(" ");
    }

    document.getElementById('inputText').value = content;
    updateWordCount();
    runAnalysis();
  };
  reader.readAsText(file);
}

async function loadSample() {
  document.getElementById('analyzeBtn').textContent = 'Loading...';
  document.getElementById('analyzeBtn').disabled = true;
  try {
    const res = await fetch('corpus/DagonByHPLovecraft.txt');
    if (!res.ok) throw new Error('Not found');
    const text = await res.text();
    document.getElementById('inputText').value = text;
    updateWordCount();
    runAnalysis();
  } catch {
    console.warn('Sample text could not be loaded.');
  } finally {
    document.getElementById('analyzeBtn').textContent = 'Analyze';
    document.getElementById('analyzeBtn').disabled = false;
  }
}

document.getElementById('analyzeBtn').addEventListener('click', runAnalysis);
document.getElementById('inputText').addEventListener('input', updateWordCount);
document.getElementById('fileInput').addEventListener('change', uploadFile);
document.getElementById('scaleToggleBtn').addEventListener('click', toggleScale);
document.getElementById('stopWordsToggle').addEventListener('change', () => {
  if (document.getElementById('inputText').value.trim()) runAnalysis();
});
document.getElementById("expandTableBtn").addEventListener("click", toggleTable);
document.getElementById("csvBtn").addEventListener("click", downloadCSV);
document.getElementById("downloadChartBtn").addEventListener("click", downloadChart);

updateWordCount();
loadSample();