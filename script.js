// Utility function to create a graph
function createGraph(svgId, title, xLabel, yLabel, xDomain, yDomain) {
  const svg = d3.select(svgId);
  const width = +svg.attr("width");
  const height = +svg.attr("height");
  const margin = { top: 20, right: 20, bottom: 50, left: 60 };

  const xScale = d3.scaleLinear().domain(xDomain).range([margin.left, width - margin.right]);
  const yScale = d3.scaleLinear().domain(yDomain).range([height - margin.bottom, margin.top]);

  const xAxis = d3.axisBottom(xScale).ticks(10);
  const yAxis = d3.axisLeft(yScale).ticks(10);

  svg.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(xAxis)
    .append("text")
    .attr("x", (width + margin.left - margin.right) / 2)
    .attr("y", 35)
    .attr("fill", "black")
    .style("font-size", "12px")
    .text(xLabel);

  svg.append("g")
    .attr("class", "y-axis")
    .attr("transform", `translate(${margin.left},0)`)
    .call(yAxis)
    .append("text")
    .attr("x", -height / 2.5)
    .attr("y", -35)
    .attr("transform", "rotate(-90)")
    .attr("fill", "black")
    .style("font-size", "12px")
    .text(yLabel);

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", margin.top / 0.5)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .text(title);

  return { svg, xScale, yScale };
}

// Create graphs
const sineGraph = createGraph("#sine-chart", "", "Time (s)", "Position (m)", [0, 20], [-3, 3]);
const cosineGraph = createGraph("#cosine-chart", "", "Time (s)", "Velocity (m/s)", [0, 20], [-3, 3]);
const potentialEnergyGraph = createGraph("#potential-energy-chart", "", "Position (m)", "Potential Energy (J)", [-5, 5], [0, 15]);
const forceGraph = createGraph("#force-chart", "", "Position (m)", "Force (N)", [-5, 5], [-40, 40]);
const velocityPositionGraph = createGraph("#velocity-position-chart","","Position (m)","Velocity (m/s)",[-5, 5],[-3, 3]);

function generateData(k, m, v0, duration = 20, points = 500) {
  const w = Math.sqrt(k / m); // Angular frequency
  const n = Math.sqrt(m / k);

  const sinData = Array.from({ length: points }, (_, i) => {
    const t = (i / (points - 1)) * duration;
    return { t, y: v0 * n * Math.sin(w * t) }; // Position
  });

  const cosData = Array.from({ length: points }, (_, i) => {
    const t = (i / (points - 1)) * duration;
    return { t, y: v0 * Math.cos(w * t) }; // Velocity
  });

  const data = Array.from({ length: points }, (_, i) => {
    const t = (i / (points - 1)) * duration; // Time
    const x = v0 * n * Math.sin(w * t); // Position
    const U = 0.5 * k * x ** 2; // Potential Energy
    const F = -k * x; // Force
    const v = v0 * Math.cos(w * t); // Velocity
    return { t, x, U, F, v };
  });

  return { sinData, cosData, data, w };
}


// Animate sine wave
function animateSine(data, w) {
  const sinePath = sineGraph.svg.append("path")
    .attr("class", "dynamic") // Mark as dynamic
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 2);

  let tOffset = 0;

  function step() {
    const speed = parseFloat(document.getElementById("speed-sin").value) * 0.1;

    const sineData = data.map(d => ({ t: d.t, y: Math.sin(w * d.t + tOffset) }));
    sinePath.datum(sineData)
      .attr("d", d3.line()
        .x(d => sineGraph.xScale(d.t))
        .y(d => sineGraph.yScale(d.y))
      );

    tOffset += speed;
    requestAnimationFrame(step);
  }

  step();
}

// Animate cosine wave
function animateCosine(data, w) {
  const cosinePath = cosineGraph.svg.append("path")
    .attr("class", "dynamic") // Mark as dynamic
    .attr("fill", "none")
    .attr("stroke", "green")
    .attr("stroke-width", 2);

  let tOffset = 0;

  function step() {
    const speed = parseFloat(document.getElementById("speed-cos").value) * 0.1;

    const cosineData = data.map(d => ({ t: d.t, y: Math.cos(w * d.t + tOffset) }));
    cosinePath.datum(cosineData)
      .attr("d", d3.line()
        .x(d => cosineGraph.xScale(d.t))
        .y(d => cosineGraph.yScale(d.y))
      );

    tOffset += speed;
    requestAnimationFrame(step);
  }

  step();
}

function animatePEAndForceAndVelocity(data, totalEnergy) {
  // Define and draw paths for PE, Force, and Velocity graphs
  const peLine = d3.line()
    .x(d => potentialEnergyGraph.xScale(d.x))
    .y(d => potentialEnergyGraph.yScale(d.U));

  const forceLine = d3.line()
    .x(d => forceGraph.xScale(d.x))
    .y(d => forceGraph.yScale(d.F));

  const vpLine = d3.line()
    .x(d => velocityPositionGraph.xScale(d.x))
    .y(d => velocityPositionGraph.yScale(d.v));

  // Clear previous dynamic elements
  potentialEnergyGraph.svg.selectAll(".dynamic").remove();
  forceGraph.svg.selectAll(".dynamic").remove();
  velocityPositionGraph.svg.selectAll(".dynamic").remove();

  // Draw new paths
  potentialEnergyGraph.svg.append("path")
    .datum(data)
    .attr("class", "dynamic")
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 2)
    .attr("d", peLine);

  forceGraph.svg.append("path")
    .datum(data)
    .attr("class", "dynamic")
    .attr("fill", "none")
    .attr("stroke", "red")
    .attr("stroke-width", 2)
    .attr("d", forceLine);

  velocityPositionGraph.svg.append("path")
    .datum(data)
    .attr("class", "dynamic")
    .attr("fill", "none")
    .attr("stroke", "green")
    .attr("stroke-width", 2)
    .attr("d", vpLine);
    
  // Add the Total Energy line to the PE graph
  potentialEnergyGraph.svg.append("line")
    .attr("class", "dynamic total-energy-line")
    .attr("x1", potentialEnergyGraph.xScale(-5)) // Graph domain minimum
    .attr("x2", potentialEnergyGraph.xScale(5))  // Graph domain maximum
    .attr("y1", potentialEnergyGraph.yScale(totalEnergy)) // Line at Total Energy
    .attr("y2", potentialEnergyGraph.yScale(totalEnergy))
    .attr("stroke", "red")
    .attr("stroke-dasharray", "5,5")
    .attr("stroke-width", 2);

  // Add legend for Total Energy
  const legendGroup = potentialEnergyGraph.svg.append("g")
    .attr("class", "dynamic legend");

  legendGroup.append("rect")
    .attr("x", potentialEnergyGraph.xScale(3.565)) // Adjust x position
    .attr("y", potentialEnergyGraph.yScale(totalEnergy) - 23.75) // Adjust y position
    .attr("width", 73) // Width of the box
    .attr("height", 20) // Height of the box
    .attr("fill", "lightblue") // Background color
    .attr("stroke", "black") // Border color
    .attr("stroke-width", 1)
    .attr("rx", 4) // Rounded corners
    .attr("ry", 4); // Rounded corners

  legendGroup.append("text")
    .attr("x", potentialEnergyGraph.xScale(4.25)) // Center text within the box
    .attr("y", potentialEnergyGraph.yScale(totalEnergy) - 11) // Adjust text position
    .attr("text-anchor", "middle") // Center text horizontally
    .style("font-size", "12px")
    .style("fill", "black")
    .text("Total Energy");


  // Add red points
  if (potentialEnergyGraph.svg.select(".pe-point").empty()) {
    potentialEnergyGraph.svg.append("circle").attr("class", "pe-point").attr("r", 5).attr("fill", "red");
  }

  if (forceGraph.svg.select(".force-point").empty()) {
    forceGraph.svg.append("circle").attr("class", "force-point").attr("r", 5).attr("fill", "red");
  }

  if (velocityPositionGraph.svg.select(".vp-point").empty()) {
    velocityPositionGraph.svg.append("circle").attr("class", "vp-point").attr("r", 5).attr("fill", "red");
  }
}

function addAxesToVelocityPositionGraph() {
  const graph = velocityPositionGraph.svg;

  // Add vertical line at x=0
  graph.append("line")
    .attr("class", "static-axis-line") // Unique class
    .attr("x1", velocityPositionGraph.xScale(0))
    .attr("x2", velocityPositionGraph.xScale(0))
    .attr("y1", velocityPositionGraph.yScale(velocityPositionGraph.yScale.domain()[0])) // Bottom of the graph
    .attr("y2", velocityPositionGraph.yScale(velocityPositionGraph.yScale.domain()[1])) // Top of the graph
    .attr("stroke", "black")
    .attr("stroke-width", 1)
    .attr("stroke-dasharray", "5,5");

  // Add horizontal line at y=0
  graph.append("line")
    .attr("class", "static-axis-line") // Unique class
    .attr("x1", velocityPositionGraph.xScale(velocityPositionGraph.xScale.domain()[0])) // Left of the graph
    .attr("x2", velocityPositionGraph.xScale(velocityPositionGraph.xScale.domain()[1])) // Right of the graph
    .attr("y1", velocityPositionGraph.yScale(0))
    .attr("y2", velocityPositionGraph.yScale(0))
    .attr("stroke", "black")
    .attr("stroke-width", 1)
    .attr("stroke-dasharray", "5,5");
}


let globalTime = 0; // Shared global time for synchronization
const globalSpeed = 0.175; // Speed multiplier for all animations

function animateSpring(k, m, v0, data) {
  const svg = d3.select("#spring-simulation");
  const width = +svg.attr("width");
  const height = +svg.attr("height");

  // Constants for the simulation
  const platformY = 100;
  const springTopY = platformY + 10;
  const equilibriumY = 250;
  const amplitude = 100; // Base amplitude in pixels
  const blockSize = 50;
  const springWidth = 20;

  // Clear previous elements
  svg.selectAll("*").remove();

  /// Add a platform and equilibrium line
  svg.append("rect")
  .attr("x", width / 2 - 50)
  .attr("y", platformY)
  .attr("width", 100)
  .attr("height", 10)
  .attr("fill", "gray");

  svg.append("line")
  .attr("x1", width / 2 - 250)
  .attr("x2", width / 2 + 250)
  .attr("y1", equilibriumY)
  .attr("y2", equilibriumY)
  .attr("stroke", "blue")
  .attr("stroke-dasharray", "5,5")
  .attr("stroke-width", 2);

  // Add a label for the equilibrium line
  svg.append("text")
  .attr("x", width / 2 + 200) // Position to the right of the line
  .attr("y", equilibriumY -10) // Slightly offset vertically for alignment
  .attr("fill", "blue")
  .style("font-size", "15px")
  .style("font-weight", "bold")
  .text("x = 0");

      // Add spring path and block
  const spring = svg.append("path").attr("fill", "none").attr("stroke", "black").attr("stroke-width", 3);
  const block = svg.append("rect").attr("x", width / 2 - blockSize / 2).attr("y", equilibriumY).attr("width", blockSize).attr("height", blockSize).attr("fill", "red");

  function updateSpring(timeIndex, index, nextIndex, interpolationFactor) {
    // Calculate normalized position
    const normalizedPosition = data[index].x + interpolationFactor * (data[nextIndex].x - data[index].x);
    const yOffset = amplitude * normalizedPosition; // Map normalized position to amplitude

    const blockTopY = equilibriumY + yOffset;

    // Update block position
    block.attr("y", blockTopY);

    // Update spring path
    const springPath = d3.line()
      .x((d, i) => (i % 2 === 0 ? width / 2 - springWidth : width / 2 + springWidth)) // Zigzag
      .y((d, i) => springTopY + d * ((blockTopY - springTopY) / 10)); // Stretch/compress spring

    const numSegments = 10;
    const pathData = Array.from({ length: numSegments }, (_, i) => i);
    spring.attr("d", springPath(pathData));
  }

  return updateSpring;
}



function stepAnimations(data, w, updateSpring) {
  function step() {
    globalTime += globalSpeed;

    const timeIndex = globalTime % data.length;
    const index = Math.floor(timeIndex);
    const nextIndex = (index + 1) % data.length;
    const interpolationFactor = timeIndex - index;

    const current = data[index];
    const next = data[nextIndex];

    // Interpolated values
    const interpolatedX = current.x + interpolationFactor * (next.x - current.x);
    const interpolatedU = current.U + interpolationFactor * (next.U - current.U);
    const interpolatedF = current.F + interpolationFactor * (next.F - current.F);
    const interpolatedV = current.v + interpolationFactor * (next.v - current.v);

    // Update red points on graphs
    potentialEnergyGraph.svg.select(".pe-point")
      .attr("cx", potentialEnergyGraph.xScale(interpolatedX))
      .attr("cy", potentialEnergyGraph.yScale(interpolatedU));

    forceGraph.svg.select(".force-point")
      .attr("cx", forceGraph.xScale(interpolatedX))
      .attr("cy", forceGraph.yScale(interpolatedF));

    velocityPositionGraph.svg.select(".vp-point")
      .attr("cx", velocityPositionGraph.xScale(interpolatedX))
      .attr("cy", velocityPositionGraph.yScale(interpolatedV));

    // Synchronize the spring animation
    updateSpring(timeIndex, index, nextIndex, interpolationFactor);

    requestAnimationFrame(step);
  }

  step();
}


addAxesToVelocityPositionGraph();



// Event listener for the Generate button
document.getElementById("generate").addEventListener("click", () => {
  const k = parseFloat(document.getElementById("k").value);
  const m = parseFloat(document.getElementById("m").value);
  const v0 = parseFloat(document.getElementById("v0").value);

  if (!(10 <= k && k <= 20) || !(0 < m && m <= 15) || !(0 < v0 && v0 <= 2)) {
    alert("Please ensure 10 <= k <= 20, 0 < m <= 15, and 0 < v0 <= 2.");
    return;
  }

  const totalEnergy = 0.5 * m * v0 ** 2;

  const { sinData, cosData, data, w } = generateData(k, m, v0);

  // Calculate angular frequency, period, and frequency
  const T = (2 * Math.PI) / w; // Period (seconds)
  const f = 1 / T; // Frequency (Hz)

  // Update the results section
  document.getElementById("calculated-period").querySelector("span").textContent = `${T.toFixed(2)} s`;
  document.getElementById("calculated-frequency").querySelector("span").textContent = `${f.toFixed(2)} Hz`;
    
  // Adjust the y-scale of the Potential Energy graph dynamically
 const maxPE = Math.max(...data.map(d => d.U)); // Maximum Potential Energy in the data
 const newYMax = Math.max(totalEnergy, maxPE) * 1.5; // Add a 20% buffer above the largest value
 potentialEnergyGraph.yScale.domain([0, newYMax]); // Ensure 0 to adjusted max
 potentialEnergyGraph.svg.select(".y-axis").call(d3.axisLeft(potentialEnergyGraph.yScale));


  // Clear existing elements
  sineGraph.svg.selectAll(".dynamic").remove();
  cosineGraph.svg.selectAll(".dynamic").remove();
  potentialEnergyGraph.svg.selectAll(".dynamic").remove();
  forceGraph.svg.selectAll(".dynamic").remove();
  velocityPositionGraph.svg.selectAll(".dynamic").remove();


  // Initialize spring simulation
  const updateSpring = animateSpring(k, m, v0, data);

  // Start all animations
  animatePEAndForceAndVelocity(data, totalEnergy);
  animateSine(sinData, w);
  animateCosine(cosData, w);
  stepAnimations(data, w, updateSpring);
  

  // Update slider values on input
  document.getElementById("speed-sin").addEventListener("input", function () {
    document.getElementById("speed-sin-value").textContent = this.value;
  });
  
  
  document.getElementById("speed-cos").addEventListener("input", function () {
    document.getElementById("speed-cos-value").textContent = this.value;
  });
  
  
});
