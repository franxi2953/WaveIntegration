document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById('animationCanvas');
  const ctx = canvas.getContext('2d');
  const sigmaSlider = document.getElementById('sigma');
  const frequencySlider = document.getElementById('frequency');
  const angularFrequencySlider = document.getElementById('angularFrequency');
  const sigmaValueDisplay = document.getElementById('sigmaValue');
  const frequencyValueDisplay = document.getElementById('frequencyValue');
  const angularFrequencyValueDisplay = document.getElementById('angularFrequencyValue');

  const v = 0.02;
  const kRange = 50;

  // Set initial values
  sigmaValueDisplay.textContent = sigmaSlider.value;
  frequencyValueDisplay.textContent = `${frequencySlider.value} nm`;
  angularFrequencyValueDisplay.textContent = angularFrequencySlider.value;

  const startTime = Date.now();
  const numberOfPoints = 800; // Number of points to animate
  const sigma = sigmaSlider.value; // Width of the Gaussian envelope for k

  // Event listeners for sliders
  sigmaSlider.oninput = () => {
      sigmaValueDisplay.textContent = sigmaSlider.value;
  };
  frequencySlider.oninput = () => {
      frequencyValueDisplay.textContent = `${frequencySlider.value} nm`;
      updateFrequencyBasedValues();
  };
  angularFrequencySlider.oninput = () => {
      angularFrequencyValueDisplay.textContent = angularFrequencySlider.value;
  };

  function updateFrequencyBasedValues() {
      const wavelength = parseFloat(frequencySlider.value);
      const N = 3 + (27 * (700 - wavelength) / 250);
      const k = (2 * Math.PI * N) / canvas.width;
      const omega = v * k;
      angularFrequencySlider.value = omega;
      angularFrequencyValueDisplay.textContent = w.toFixed(6);
  }

  const gaussianFunction = (k, centerK) => Math.exp(-Math.pow(k - centerK, 2) / (2 * sigmaSlider.value * sigmaSlider.value));

  const animationFunction = (t) => {
      const wavelength = parseFloat(frequencySlider.value);
      const N = 3 + (27 * (700 - wavelength) / 250);
      const centerK = (2 * Math.PI * N) / canvas.width;
      const color = wavelengthToColor(wavelength);

      let maxAmplitude = 0;
      let waveValues = [];

      for (let x = 0; x < canvas.width; x += canvas.width / numberOfPoints) {

            let waveSum = 0;
            for (let step = -kRange; step <= kRange; step += 0.1) {
                const k = centerK + step * 0.01; // Small steps around centerK
                const omega = v * k ;  // Assuming omega = v * k for demonstration
                const weight = gaussianFunction(k, centerK);
                const phase = k * (x - canvas.width / 2) - omega * t;  // Correcting the phase term
                const contribution = weight * Math.cos(phase);
                waveSum += contribution;
                if (Math.abs(contribution) > maxAmplitude) {
                    maxAmplitude = Math.abs(contribution);
                }
            }
            
            waveValues.push({ x, waveSum: Math.abs(waveSum) * (canvas.height*0.01)/ maxAmplitude });
        }

        console.log(maxAmplitude)

      // Clear the canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw each calculated wave value
      waveValues.forEach(({ x, waveSum }) => {
          const y = (canvas.height) - 20 - (waveSum); // Adjust amplitude visualization
          ctx.beginPath();
          ctx.arc(x, y, 2, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
          ctx.closePath();
      });

      drawAxis(ctx, canvas.width, canvas.height, N);
      drawKspace();
      
  };


  const animate = () => {
      const currentTime = Date.now();
      const t = (currentTime - startTime)*0.5; // Continuous time, no reset

      animationFunction(t);

      requestAnimationFrame(animate);
  };

  animate();


function drawKspace() {
    const wavelength = parseFloat(frequencySlider.value);
    const N = 3 + (27 * (700 - wavelength) / 250);
    const centerK = (2 * Math.PI * N) / canvas.width;  // Central k value
    const kRange = 50;  // Range of k values to consider around centerK

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'; // Semi-transparent white for Gaussian curve
    ctx.beginPath();
    let previousWeight = 0;  // Track the previous weight to find crossing points
    for (let step = -kRange; step <= kRange; step += 1) {
        const k = centerK + step * 0.01; // Small steps around centerK
        const weight = gaussianFunction(k, centerK);
        const scaledWeight = weight * 100;  // Scale the Gaussian values for visualization
        ctx.rect(100 + step, 150 - scaledWeight, 1, scaledWeight);  // Draw tiny rectangles for Gaussian

        // Check if weight crosses 0.5 and the previous weight is less than 0.5 or vice versa
        if ((weight > 0.5 && previousWeight <= 0.5) || (weight < 0.5 && previousWeight >= 0.5)) {
            ctx.stroke(); // Finish drawing the current path
            ctx.beginPath(); // Start a new path for the line
            ctx.strokeStyle = 'yellow'; // Set line color for threshold crossing
            ctx.moveTo(100 + step, 140);  // Draw line above the Gaussian curve slightly
            ctx.lineTo(100 + step, 160);
            ctx.stroke();
            ctx.fillStyle = 'yellow'; // Text color
            ctx.fillText(`${k.toFixed(2)}`, 100 + step, 190); // Display k-value at crossing point
            ctx.beginPath(); // Resume path for Gaussian
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'; // Reset fill color for Gaussian
        }
        previousWeight = weight; // Update previous weight
    }
    ctx.fill();

    // Draw central k line
    ctx.strokeStyle = 'red'; // Line color for central k
    ctx.beginPath();
    ctx.moveTo(100, 140);
    ctx.lineTo(100, 160);
    ctx.stroke();
    ctx.fillStyle = 'red'; // Text color
    ctx.fillText(`${centerK.toFixed(2)}`, 100, 170); // Label for center k
}



  function drawAxis(ctx, width, height, N) {
    const axisY = height - 20; // Offset from the bottom
    const tickLength = 10;
    const numTicks = 10;
    const tickSpacing = width / numTicks;

    // Draw horizontal axis
    ctx.beginPath();
    ctx.strokeStyle = 'white';
    ctx.moveTo(0, axisY);
    ctx.lineTo(width, axisY);
    ctx.stroke();

    // Draw ticks and labels
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    for (let i = 0; i <= numTicks; i++) {
        const x = i * tickSpacing;
        ctx.beginPath();
        ctx.moveTo(x, axisY);
        ctx.lineTo(x, axisY + tickLength);
        ctx.stroke();

        // Draw labels
        const label = (i - numTicks / 2) * (2 * N / numTicks);
        ctx.fillText(label.toFixed(0), x, axisY + tickLength + 10);
    }
}

});

function wavelengthToColor(wavelength) {
  let R, G, B, alpha, colorSpace;
  if (wavelength >= 380 && wavelength < 440) {
      R = -(wavelength - 440) / (440 - 380);
      G = 0;
      B = 1;
  } else if (wavelength >= 440 && wavelength < 490) {
      R = 0;
      G = (wavelength - 440) / (490 - 440);
      B = 1;
  } else if (wavelength >= 490 && wavelength < 510) {
      R = 0;
      G = 1;
      B = -(wavelength - 510) / (510 - 490);
  } else if (wavelength >= 510 && wavelength < 580) {
      R = (wavelength - 510) / (580 - 510);
      G = 1;
      B = 0;
  } else if (wavelength >= 580 && wavelength < 645) {
      R = 1;
      G = -(wavelength - 645) / (645 - 580);
      B = 0;
  } else if (wavelength >= 645 && wavelength <= 780) {
      R = 1;
      G = 0;
      B = 0;
  } else {
      R = 0;
      G = 0;
      B = 0;
  }

  // Let the intensity fall off near the vision limits
  if (wavelength >= 380 && wavelength < 420) {
      alpha = 0.3 + 0.7*(wavelength - 380) / (420 - 380);
  } else if (wavelength >= 420 && wavelength <= 700) {
      alpha = 1;
  } else if (wavelength > 700 && wavelength <= 780) {
      alpha = 0.3 + 0.7*(780 - wavelength) / (780 - 700);
  } else {
      alpha = 0;
  }

  alpha = alpha * 255;
  return "rgba(" + Math.round(R * 255) + ", " + Math.round(G * 255) + ", " + Math.round(B * 255) + ", " + (alpha / 255) + ")";
}
