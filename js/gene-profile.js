document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('fileInput').addEventListener('change', handleFileUpload);
});

function handleFileUpload(event) {
  const file = event.target.files[0];
  const reader = new FileReader();
  reader.onload = function(e) {
      const csvData = e.target.result;
      loadCSVData(csvData);
  };
  reader.readAsText(file);
}

function loadCSVData(csvData) {
  const rows = csvData.split('\n');
  const data = rows.map(row => row.split(',').map(Number));
  const genes = rows[0].split(',').slice(1); // Assuming first row has gene names
  const samples = rows.slice(1).map(row => row.split(',')[0]); // Assuming first column has sample names

  const values = rows.slice(1).map(row => row.split(',').slice(1).map(Number));

  plotHeatmap(genes, samples, values);
}

function plotHeatmap(genes, samples, values) {
  const data = [{
      z: values,
      x: genes,
      y: samples,
      type: 'heatmap',
      colorscale: 'Viridis'
  }];

  const layout = {
      title: 'Gene Expression Heatmap',
      xaxis: { title: 'Genes' },
      yaxis: { title: 'Samples' }
  };

  Plotly.newPlot('heatmap', data, layout);
}
