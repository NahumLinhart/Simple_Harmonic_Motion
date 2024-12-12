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
const potentialEnergyGraph = createGraph("#potential-energy-chart", "", "Position (m)", "Potential Energy (J)", [-5, 5], [0, 30]);
const forceGraph = createGraph("#force-chart", "", "Position (m)", "Force (N)", [-5, 5], [-40, 40]);

// Generate data for all graphs
function generateData(k, m, v0, duration = 20, points = 500) {
  const w = Math.sqrt(k / m); // Angular frequency
  const n = Math.sqrt(m/k);
  return {
    sinData: Array.from({ length: points }, (_, i) => {
      const t = (i / (points - 1)) * duration;
      return { t, y: v0 * n * Math.sin(w * t) }; // Position
    }),
    cosData: Array.from({ length: points }, (_, i) => {
      const t = (i / (points - 1)) * duration;
      return { t, y: v0 * Math.cos(w * t) }; // Velocity
    }),
    peAndForceData: Array.from({ length: points }, (_, i) => {
      const t = (i / (points - 1)) * duration;
      const x = v0 * n * Math.sin(w * t); // Position
      const U = 0.5 * k * x ** 2; // Potential Energy
      const F = -k * x; // Force
      return { x, U, F };
    }),
    w,
  };
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
    .attr("stroke", "orange")
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

function animatePEAndForce(data, totalEnergy) {
  const peLine = d3.line()
    .x(d => potentialEnergyGraph.xScale(d.x))
    .y(d => potentialEnergyGraph.yScale(d.U));

  const forceLine = d3.line()
    .x(d => forceGraph.xScale(d.x))
    .y(d => forceGraph.yScale(d.F));

  // Clear previous dynamic elements
  potentialEnergyGraph.svg.selectAll(".dynamic").remove();
  forceGraph.svg.selectAll(".dynamic").remove();

  // Draw Potential Energy path
  potentialEnergyGraph.svg.append("path")
    .datum(data)
    .attr("class", "dynamic")
    .attr("fill", "none")
    .attr("stroke", "blue")
    .attr("stroke-width", 2)
    .attr("d", peLine);

  // Draw Total Energy horizontal line
  potentialEnergyGraph.svg.append("line")
    .attr("class", "dynamic total-energy-line")
    .attr("x1", potentialEnergyGraph.xScale(-5))
    .attr("x2", potentialEnergyGraph.xScale(5))
    .attr("y1", potentialEnergyGraph.yScale(totalEnergy))
    .attr("y2", potentialEnergyGraph.yScale(totalEnergy))
    .attr("stroke", "red")
    .attr("stroke-dasharray", "5,5")
    .attr("stroke-width", 2);

    const legendGroup = potentialEnergyGraph.svg.append("g")
  .attr("class", "dynamic legend");

// Add a rectangle behind the text
legendGroup.append("rect")
  .attr("x", potentialEnergyGraph.xScale(3.75)) // Adjust x position
  .attr("y", potentialEnergyGraph.yScale(totalEnergy) - 25) // Adjust y position
  .attr("width", 73) // Width of the box
  .attr("height", 20) // Height of the box
  .attr("fill", "lightgrey") // Background color
  .attr("stroke", "black") // Border color
  .attr("stroke-width", 1)
  .attr("rx", 4) // Rounded corners
  .attr("ry", 4); // Rounded corners

// Add the text inside the rectangle
legendGroup.append("text")
  .attr("x", potentialEnergyGraph.xScale(4.25)) // Center text within the box
  .attr("y", potentialEnergyGraph.yScale(totalEnergy) - 11) // Adjust text position
  .attr("text-anchor", "middle") // Center text horizontally
  .style("font-size", "12px")
  .style("fill", "black")
  .text("Total Energy");

  // Draw Force path
  forceGraph.svg.append("path")
    .datum(data)
    .attr("class", "dynamic")
    .attr("fill", "none")
    .attr("stroke", "red")
    .attr("stroke-width", 2)
    .attr("d", forceLine);

  // Add animated red points
  const pePoint = potentialEnergyGraph.svg.append("circle")
    .attr("class", "dynamic")
    .attr("r", 5)
    .attr("fill", "red");

  const forcePoint = forceGraph.svg.append("circle")
    .attr("class", "dynamic")
    .attr("r", 5)
    .attr("fill", "red");

  // Oscillation variables
  let position = 0; // Continuous position (fractional index)
  const speed = 0.25; // Speed of motion (lower value = slower motion)

  function step() {
    // Update position
    position += speed;

    // Handle forward and backward oscillation
    if (position >= data.length - 1) position = 0; // Loop back to start

    // Interpolate index for smoother animation
    const currentIndex = Math.floor(position);
    const nextIndex = (currentIndex + 1) % data.length;
    const interpolationFactor = position - currentIndex;

    const current = data[currentIndex];
    const next = data[nextIndex];

    // Interpolated x and y values for smooth motion
    const interpolatedX = current.x + interpolationFactor * (next.x - current.x);
    const interpolatedU = current.U + interpolationFactor * (next.U - current.U);
    const interpolatedF = current.F + interpolationFactor * (next.F - current.F);

    // Update ball positions
    pePoint
      .attr("cx", potentialEnergyGraph.xScale(interpolatedX))
      .attr("cy", potentialEnergyGraph.yScale(interpolatedU));

    forcePoint
      .attr("cx", forceGraph.xScale(interpolatedX))
      .attr("cy", forceGraph.yScale(interpolatedF));

    requestAnimationFrame(step);
  }

  step();
}


// Event listener for generating graphs
document.getElementById("generate").addEventListener("click", () => {
  const k = parseFloat(document.getElementById("k").value);
  const m = parseFloat(document.getElementById("m").value);
  const v0 = parseFloat(document.getElementById("v0").value);

  if (!(1 <= k && k <= 20) || !(0 < m && m <= 10) || !(0 <= v0 && v0 <= 2.25)) {
    alert("Please ensure 1 <= k <= 20, 0 < m <= 10, and 0 <= v0 <= 2.25");
    return;
  }
  
  const totalEnergy = 0.5 * m * v0 ** 2;
  


  // Adjust the y-scale of the Potential Energy graph dynamically
  const newYMax = totalEnergy * 1.5; // Add 50% buffer
  potentialEnergyGraph.yScale.domain([0, newYMax]);
  potentialEnergyGraph.svg.select(".y-axis").call(d3.axisLeft(potentialEnergyGraph.yScale));

  const { sinData, cosData, peAndForceData, w } = generateData(k, m, v0);

  
  // Clear previous paths and dynamic elements, keep axes and labels
  sineGraph.svg.selectAll(".dynamic").remove();
  cosineGraph.svg.selectAll(".dynamic").remove();
  potentialEnergyGraph.svg.selectAll(".dynamic").remove();
  forceGraph.svg.selectAll(".dynamic").remove();

  // Start animations
  animateSine(sinData, w);
  animateCosine(cosData, w);
  animatePEAndForce(peAndForceData, totalEnergy);
});

// Update slider values on input
document.getElementById("speed-sin").addEventListener("input", function () {
  document.getElementById("speed-sin-value").textContent = this.value;
});

document.getElementById("speed-cos").addEventListener("input", function () {
  document.getElementById("speed-cos-value").textContent = this.value;
});

