function runSimulation() {
    // Fetch input parameters
    const numIndividuals = parseInt(document.getElementById('numIndividuals').value);
    initialWealth = parseInt(document.getElementById('initialWealth').value); // Store globally
    const numEncounters = parseInt(document.getElementById('numEncounters').value);
    const numSimulations = parseInt(document.getElementById('numSimulations').value);

    // Run simulations and store results in global variable
    allSimulations = [];
    for (let i = 0; i < numSimulations; i++) {
        let simulationResult = simulateWealthDistribution(numIndividuals, initialWealth, numEncounters);
        allSimulations.push(simulationResult);
    }

    // Display results
    displayResults(allSimulations, initialWealth);
    populateDropdown(allSimulations.length);
    updateStatistics(); // Initial display of first simulation statistics
}

// Populate dropdown options for each simulation
function populateDropdown(numSimulations) {
    const selector = document.getElementById("simulationSelector");
    selector.innerHTML = ''; // Clear previous options
    for (let i = 0; i < numSimulations; i++) {
        const option = document.createElement("option");
        option.value = i;
        option.textContent = `Simulation ${i + 1}`;
        selector.appendChild(option);
    }
}

function displayResults(allSimulations, initialWealth) {
    const ctx = document.getElementById('wealthChart').getContext('2d');
    if (window.wealthChart instanceof Chart) {
        window.wealthChart.destroy();
    }

    // Define wealth bins dynamically based on the maximum wealth in simulations
    const maxWealthObserved = Math.max(...allSimulations.flat());
    const wealthBins = Array.from({ length: Math.ceil(maxWealthObserved / 5) + 1 }, (_, i) => i * 5);

    // Prepare datasets and calculate max Y-axis value
    const datasets = [];
    let maxFrequency = 0;

    allSimulations.forEach((simulation, index) => {
        const binnedData = binWealthDistribution(simulation, wealthBins);
        maxFrequency = Math.max(maxFrequency, ...binnedData);

        datasets.push({
            label: `Simulation ${index + 1}`,
            data: binnedData,
            borderColor: `hsl(${index * 360 / allSimulations.length}, 70%, 50%)`,
            backgroundColor: `hsla(${index * 360 / allSimulations.length}, 70%, 50%, 0.3)`,
            fill: true,
            tension: 0.4 // Smoothing for natural curve
        });
    });

    // Create the line chart with dynamic axes
    window.wealthChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: wealthBins,
            datasets: datasets
        },
        options: {
            animation: false,
            plugins: { legend: { display: false } }, // Hide legend
            scales: {
                x: {
                    title: { display: true, text: 'Wealth (Coins)' },
                    min: 0,
                    max: wealthBins[wealthBins.length - 1] // Set max based on actual data
                },
                y: {
                    title: { display: true, text: 'Number of Individuals' },
                    beginAtZero: true,
                    max: maxFrequency
                }
            }
        }
    });

    // Generate report for the first selected simulation
    generateReport(allSimulations, initialWealth);
}


// Function to generate statistics for the selected simulation
function updateStatistics() {
    const selectedSimulation = parseInt(document.getElementById("simulationSelector").value);
    generateReport([allSimulations[selectedSimulation]], initialWealth);
}

// Function to generate the report for a specific simulation
function generateReport(selectedSimulations, initialWealth) {
    const reportDiv = document.getElementById('report');
    reportDiv.innerHTML = "<h3>Statistical Report</h3><div class='card-container'></div>";
    const cardContainer = reportDiv.querySelector('.card-container');

    selectedSimulations.forEach((simulation, index) => {
        const totalWealth = simulation.reduce((sum, wealth) => sum + wealth, 0);
        const meanWealth = totalWealth / simulation.length;
        const variance = simulation.reduce((sum, wealth) => sum + Math.pow(wealth - meanWealth, 2), 0) / simulation.length;
        const stdDev = Math.sqrt(variance);
        const zeroWealth = simulation.filter(w => w === 0).length;
        const richIndividuals = simulation.filter(w => w > initialWealth).length;

        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <h4>Simulation ${index + 1}</h4>
            <p>Total Wealth: ${totalWealth}</p>
            <p>Mean Wealth: ${meanWealth.toFixed(2)}</p>
            <p>Standard Deviation: ${stdDev.toFixed(2)}</p>
            <p>Individuals with Zero Wealth: ${zeroWealth}</p>
            <p>Individuals Richer than Initial Wealth: ${richIndividuals}</p>
        `;

        cardContainer.appendChild(card);
    });
}

// Function to simulate the wealth distribution among individuals
function simulateWealthDistribution(numIndividuals, initialWealth, numEncounters) {
    // Initialize population with each individual having the initial wealth
    let population = Array(numIndividuals).fill(initialWealth);

    // Simulate encounters
    for (let i = 0; i < numEncounters; i++) {
        // Randomly select two individuals
        let [a, b] = [randomIndex(numIndividuals), randomIndex(numIndividuals)];
        if (a === b) continue; // Skip if both are the same individual

        // Simulate a 50% chance of wealth transfer between individuals
        if (Math.random() < 0.5 && population[a] > 0) {
            population[a] -= 1;
            population[b] += 1;
        } else if (population[b] > 0) {
            population[b] -= 1;
            population[a] += 1;
        }
    }

    return population;
}

// Helper function to get a random index within the population size
function randomIndex(num) {
    return Math.floor(Math.random() * num);
}


// Function to bin wealth distribution data
function binWealthDistribution(population, bins) {
    const binCounts = Array(bins.length).fill(0);
    population.forEach(wealth => {
        for (let i = bins.length - 1; i >= 0; i--) {
            if (wealth >= bins[i]) {
                binCounts[i]++;
                break;
            }
        }
    });
    return binCounts;
}
