// Global variables to hold EEG data and Plotly chart configuration
let eegData = {
    times: [], // Array to hold time stamps
    channels: [] // Array to hold data for each channel
};
const totalChannels = 8; // Total number of EEG channels
const updateInterval = 10; // Time in milliseconds between data updates (faster refresh rate)
const maxDataPoints = 500; // Maximum number of data points to display on the graph
let isUpdating = false; // Flag to control the updates

// Initialize the channel data arrays
for (let i = 0; i < totalChannels; i++) {
    eegData.channels.push({ name: `Channel ${i + 1}`, values: [] });
}

document.addEventListener('DOMContentLoaded', () => {
    initializeTimeSeries();
    initializeFFTPlot();
    initializeHeadPlot();
    setupUpdateControls();
    startRandomDataUpdates();
    setupFileUpload();
});

function setupUpdateControls() {
    const startButton = document.getElementById('startButton');
    const stopButton = document.getElementById('stopButton');

    startButton.addEventListener('click', () => {
        isUpdating = true;
    });

    stopButton.addEventListener('click', () => {
        isUpdating = false;
    });
}

function setupFileUpload() {
    document.getElementById('fileInput').addEventListener('change', handleFileUpload);
}

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
    eegData.times = [];
    eegData.channels.forEach(channel => { channel.values = []; });

    rows.forEach((row, index) => {
        const columns = row.split(',');
        if (index > 0 && columns.length === totalChannels + 1) {
            eegData.times.push(columns[0]);
            columns.slice(1).forEach((value, channelIndex) => {
                eegData.channels[channelIndex].values.push(parseFloat(value));
            });
        }
    });

    updateTimeSeries();
    updateFFTPlot();
    updateHeadPlot();
}

function initializeTimeSeries() {
    let traces = eegData.channels.map(channel => ({
        x: [],
        y: [],
        type: 'scatter',
        mode: 'lines',
        name: channel.name
    }));

    let layout = {
        title: 'EEG Time Series',
        xaxis: { title: 'Time (s)', rangeslider: {} },
        yaxis: { title: 'Amplitude (µV)' },
        dragmode: 'pan'
    };

    Plotly.newPlot('time-series', traces, layout);
}

function initializeFFTPlot() {
    let traces = [{
        x: [],
        y: [],
        type: 'scatter',
        mode: 'lines',
        name: 'FFT'
    }];

    let layout = {
        title: 'EEG FFT Plot',
        xaxis: { title: 'Frequency (Hz)' },
        yaxis: { title: 'Amplitude (µV)' },
        dragmode: 'pan'
    };

    Plotly.newPlot('fft-plot', traces, layout);
}

function initializeHeadPlot() {
    let layout = {
        title: 'Head Plot',
        xaxis: { range: [-1.5, 1.5], showgrid: false, zeroline: false, showticklabels: false },
        yaxis: { range: [-1.5, 1.5], showgrid: false, zeroline: false, showticklabels: false },
        shapes: [
            // Head outline
            {
                type: 'circle',
                xref: 'x',
                yref: 'y',
                x0: -1,
                y0: -1,
                x1: 1,
                y1: 1,
                line: {
                    color: 'black'
                }
            },
            // Nose
            {
                type: 'path',
                path: 'M -0.1,1 L 0.1,1 L 0,1.2 Z',
                line: {
                    color: 'black'
                }
            },
            // Ears
            {
                type: 'path',
                path: 'M -1,-0.3 C -1.2,0 -1.2,-0.6 -1,-0.3 Z',
                line: {
                    color: 'black'
                }
            },
            {
                type: 'path',
                path: 'M 1,-0.3 C 1.2,0 1.2,-0.6 1,-0.3 Z',
                line: {
                    color: 'black'
                }
            }
        ]
    };

    let data = eegData.channels.map((channel, index) => ({
        x: [Math.cos(index * 2 * Math.PI / totalChannels)],
        y: [Math.sin(index * 2 * Math.PI / totalChannels)],
        mode: 'markers+text',
        marker: { size: 20, color: 0, colorscale: 'Jet', cmin: -10, cmax: 10 },
        text: [index + 1],
        textposition: 'top center'
    }));

    Plotly.newPlot('head-plot', data, layout);
}

function generateEEGSignal(time, channelIndex) {
    // Simulate more realistic EEG signals using a combination of sine waves and random noise
    const frequencies = [1, 5, 10, 20]; // Example frequencies for EEG signals
    let signal = frequencies.reduce((sum, freq) => {
        return sum + Math.sin(2 * Math.PI * freq * time / 1000);
    }, 0);
    signal += (Math.random() - 0.5) * 5; // Add some random noise
    return signal;
}

function startRandomDataUpdates() {
    let dataBuffer = [];
    setInterval(() => {
        if (isUpdating) {
            let currentTime = new Date();
            let time = currentTime.toISOString();

            eegData.channels.forEach((channel, index) => {
                let newValue = generateEEGSignal(currentTime.getTime(), index);
                channel.values.push(newValue);
                if (channel.values.length > maxDataPoints) {
                    channel.values.shift();
                }
            });

            dataBuffer.push(time);
            if (dataBuffer.length >= 10) { // Batch update every 10 intervals
                eegData.times = eegData.times.concat(dataBuffer);
                if (eegData.times.length > maxDataPoints) {
                    eegData.times = eegData.times.slice(-maxDataPoints);
                }
                updateTimeSeries();
                updateFFTPlot();
                updateHeadPlot();
                dataBuffer = [];
            }
        }
    }, updateInterval);
}

function updateTimeSeries() {
    let traces = eegData.channels.map((channel, index) => ({
        x: eegData.times,
        y: channel.values,
        type: 'scatter',
        mode: 'lines',
        name: `Channel ${index + 1}`
    }));

    let layout = {
        xaxis: { title: 'Time (s)', rangeslider: {} },
        yaxis: { title: 'Amplitude (µV)' },
        dragmode: 'pan'
    };

    Plotly.react('time-series', traces, layout);
}

function updateFFTPlot() {
    // Perform FFT on the last `maxDataPoints` data points of the first channel for simplicity
    let fftSize = maxDataPoints;
    let signal = eegData.channels[0].values.slice(-fftSize);
    let fft = calculateFFT(signal);

    let traces = [{
        x: fft.frequencies,
        y: fft.amplitudes,
        type: 'scatter',
        mode: 'lines',
        name: 'FFT'
    }];

    let layout = {
        xaxis: { title: 'Frequency (Hz)' },
        yaxis: { title: 'Amplitude (µV)' },
        dragmode: 'pan'
    };

    Plotly.react('fft-plot', traces, layout);
}

function calculateFFT(signal) {
    // Simple FFT calculation (placeholder)
    let n = signal.length;
    let frequencies = [];
    let amplitudes = [];
    for (let i = 0; i < n / 2; i++) {
        frequencies.push(i);
        amplitudes.push(Math.sqrt(signal[i] * signal[i])); // Placeholder for FFT amplitude calculation
    }
    return { frequencies, amplitudes };
}

function updateHeadPlot() {
    let data = eegData.channels.map((channel, index) => ({
        x: [Math.cos(index * 2 * Math.PI / totalChannels)],
        y: [Math.sin(index * 2 * Math.PI / totalChannels)],
        mode: 'markers+text',
        marker: {
            size: 20 + Math.abs(channel.values[channel.values.length - 1]) * 2,
            color: channel.values[channel.values.length - 1],
            colorscale: 'Jet',
            cmin: -10,
            cmax: 10
        },
        text: [index + 1],
        textposition: 'top center'
    }));

    let layout = {
        xaxis: { range: [-1.5, 1.5], showgrid: false, zeroline: false, showticklabels: false },
        yaxis: { range: [-1.5, 1.5], showgrid: false, zeroline: false, showticklabels: false },
        shapes: [
            // Head outline
            {
                type: 'circle',
                xref: 'x',
                yref: 'y',
                x0: -1,
                y0: -1,
                x1: 1,
                y1: 1,
                line: {
                    color: 'black'
                }
            },
            // Nose
            {
                type: 'path',
                path: 'M -0.1,1 L 0.1,1 L 0,1.2 Z',
                line: {
                    color: 'black'
                }
            },
            // Ears
            {
                type: 'path',
                path: 'M -1,-0.3 C -1.2,0 -1.2,-0.6 -1,-0.3 Z',
                line: {
                    color: 'black'
                }
            },
            {
                type: 'path',
                path: 'M 1,-0.3 C 1.2,0 1.2,-0.6 1,-0.3 Z',
                line: {
                    color: 'black'
                }
            }
        ]
    };

    Plotly.react('head-plot', data, layout);
}
