
import './lib/webaudio-controls.js';

const getBaseURL = () => {
    const base = new URL('.', import.meta.url);
    console.log("Base = " + base);
    return `${base}`;
};

const template = document.createElement("template");
template.innerHTML = `
  <style>
    H1 {
        color:grey;
    }

    label, output {
        color:grey;
    }

    canvas {
        width:80%;
    }

    .buttonPlay {
        margin-left:60px;
    }

    .buttonPause {
        margin-left:20px;
        margin-right:20px;
    }

    .buttonReset {
        margin-left:5px;
        margin-right:20px;
    }

    .stereo {
        
    }

    .controls {
        text-align: center;
    }

    div.controls label {
        display: inline-block;
        text-align: center;
        width: 50px;
    }

    progress {
        width:80%;
        height:15px;
        background-color:grey;
    }

    #myCanvas {
        border:1px solid;
      }
  </style>
  <div style="background-color:grey; text-align:center; margin-left:20%; margin-right:20%">
  <div style="background-color:black; text-align:center; margin: 25px 25px 25px 25px">
  <div>
  <h1>Audio Player</h1>
  </div>
  <audio id="myPlayer" crossorigin>
        <source src="./myComponents/assets/mp3/titre1.mp3" type="audio/mp3" />
  </audio>

  <canvas id="myCanvas" width=300 height=100></canvas>

  <br>
  <div>
  <progress id="progressRuler" min=0 value=0 step=0.1></progress>
  </div>
  <br>

  <div style="width: 100%">
  <webaudio-knob class="volume" id="knob-1" tooltip="Volume:%s" src="./assets/imgs/OberKnob.png" sprites="99" value=1 min="0" max="1" step=0.01></webaudio-knob>

  <webaudio-switch class= "buttonPlay" id="playButton" width="60" height="60" src="./assets/imgs/playButton.png" type="toggle" value="false"></webaudio-switch>
  <webaudio-switch class= "buttonPause" id="pauseButton" width="60" height="60" src="./assets/imgs/pauseButton.png" type="toggle" value="false"></webaudio-switch>
  <webaudio-switch class= "buttonReset" id="toZeroButton" width="60" height="60" src="./assets/imgs/resetButton.png" type="toggle" value="false"></webaudio-switch>

  <label>L</label>
  <webaudio-knob class="stereo" id="knobStereo" tooltip="Balance:%s" src="./assets/imgs/equalizer.png" sprites="60" value=0 min="-1" max="1" step=0.05 width="140" height="32"></webaudio-knob>
  <label>R</label>
  </div>

  <br>

  <div id="meter">
    <webaudio-knob id="meterKnob" src="./assets/imgs/meter.png" sprites="100" value="100" min="124" max="134" step="0.1" enable="0" width=170 height=150></webaudio-knob>
  </div>
  
  <br>
  <br>
  <div class="eq">
  <div class="controls">
    <label>60Hz</label>
    <webaudio-knob id="i0" tooltip="Equalizer:%s" src="./assets/imgs/equalizer.png" sprites="60" value="0" step="1" min="-30" max="30" step=0.01 width=200 height=30></webaudio-knob>
  <output id="gain0">0 dB</output>
  </div>
  <div class="controls">
    <label>170Hz</label>
    <webaudio-knob id="i1" tooltip="Equalizer:%s" src="./assets/imgs/equalizer.png" sprites="60" value="0" step="1" min="-30" max="30" step=0.01 width=200 height=30></webaudio-knob>
<output id="gain1">0 dB</output>
  </div>
  <div class="controls">
    <label>350Hz</label>
    <webaudio-knob id="i2" tooltip="Equalizer:%s" src="./assets/imgs/equalizer.png" sprites="60" value="0" step="1" min="-30" max="30" step=0.01 width=200 height=30></webaudio-knob>
<output id="gain2">0 dB</output>
  </div>
  <div class="controls">
    <label>1000Hz</label>
    <webaudio-knob id="i3" tooltip="Equalizer:%s" src="./assets/imgs/equalizer.png" sprites="60" value="0" step="1" min="-30" max="30" step=0.01 width=200 height=30></webaudio-knob>
<output id="gain3">0 dB</output>
  </div>
  <div class="controls">
    <label>3500Hz</label>
    <webaudio-knob id="i4" tooltip="Equalizer:%s" src="./assets/imgs/equalizer.png" sprites="60" value="0" step="1" min="-30" max="30" step=0.01 width=200 height=30></webaudio-knob>
<output id="gain4">0 dB</output>
  </div>
  <div class="controls">
    <label>10000Hz</label>
    <webaudio-knob id="i5" tooltip="Equalizer:%s" src="./assets/imgs/equalizer.png" sprites="60" value="0" step="1" min="-30" max="30" step=0.01 width=200 height=30></webaudio-knob>
<output id="gain5">0 dB</output>
  </div>

</div>
</div>
</div>
  `;

class MyAudioPlayer extends HTMLElement {
    constructor() {
        super();
        this.volume = 1;
        this.attachShadow({ mode: "open" });

        this.shadowRoot.appendChild(template.content.cloneNode(true));

        this.basePath = getBaseURL(); // url absolu du composant
        // Fix relative path in WebAudio Controls elements
        this.fixRelativeImagePaths();
    }

    connectedCallback() {
        this.player = this.shadowRoot.querySelector("#myPlayer");
        this.player.loop = true;

        // get the canvas, its graphic context...
        this.canvas = this.shadowRoot.querySelector("#myCanvas");
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.canvasContext = this.canvas.getContext('2d');


        let audioContext = new AudioContext();

        //////////////
        let mediaElement = this.shadowRoot.getElementById('myPlayer');
        mediaElement.onplay = (e) => { audioContext.resume(); }

        // fix for autoplay policy
        mediaElement.addEventListener('play', () => audioContext.resume());
        //////////////

        this.filters = [];

        let playerNode = audioContext.createMediaElementSource(this.player); // noeud speakers

        this.pannerNode = audioContext.createStereoPanner(); // noeud stereo

        // Create an analyser node
        this.analyserNode = audioContext.createAnalyser();
        // set visualizer options, for lower precision change 1024 to 512,
        // 256, 128, 64 etc. bufferLength will be equal to fftSize/2
        this.analyserNode.fftSize = 1024;
        this.bufferLength = this.analyserNode.frequencyBinCount;
        this.dataArray = new Uint8Array(this.bufferLength); //tableau de point de la forme d'ondes

        ////////////////////
        // create the equalizer. It's a set of biquad Filters

        // Set filters
        [60, 170, 350, 1000, 3500, 10000].forEach((freq, i) => {
            var eq = audioContext.createBiquadFilter();
            eq.frequency.value = freq;
            eq.type = "peaking";
            eq.gain.value = 0;
            this.filters.push(eq);
        });

        // Connect filters in serie
        playerNode.connect(this.filters[0]);
        for (var i = 0; i < this.filters.length - 1; i++) {
            this.filters[i].connect(this.filters[i + 1]);
        }

        // connect the different nodes
        this.filters[this.filters.length - 1].connect(this.pannerNode);
        this.pannerNode.connect(this.analyserNode);
        this.analyserNode.connect(audioContext.destination);
        ////////////////////

        this.visualize();

        this.declareListeners();
    }

    visualize() {
        // canvasContext.clearRect(0, 0, width, height);
        // Or use rgba fill to give a slight blur effect
        this.visualizeVolume();
        this.canvasContext.fillStyle = 'rgba(0, 0, 0, 0.1)';
        this.canvasContext.fillRect(0, 0, this.width, this.height);

        // 2 - Get the analyser data - for waveforms we need time domain data
        this.analyserNode.getByteTimeDomainData(this.dataArray);

        // 3 - draws the waveform
        this.canvasContext.lineWidth = 2;
        this.canvasContext.strokeStyle = 'lightBlue';

        // the waveform is in one single path, first let's
        // clear any previous path that could be in the buffer
        this.canvasContext.beginPath();
        var sliceWidth = this.width / this.bufferLength;
        var x = 0;

        for (var i = 0; i < this.bufferLength; i++) {
            // dataArray values are between 0 and 255,
            // normalize v, now between 0 and 1
            var v = this.dataArray[i] / 255;
            // y will be in [0, canvas height], in pixels
            var y = v * this.height;

            if (i === 0) {
                this.canvasContext.moveTo(x, y);
            } else {
                this.canvasContext.lineTo(x, y);
            }

            x += sliceWidth;
        }

        this.canvasContext.lineTo(this.width, this.height / 2);
        // draw the path at once
        this.canvasContext.stroke();

        requestAnimationFrame(() => { this.visualize() });
    }

    

    changeGain(sliderVal, nbFilter) {
        var value = parseFloat(sliderVal);
        this.filters[nbFilter].gain.value = value;

        // update output labels
        var output = this.shadowRoot.querySelector("#gain" + nbFilter);
        output.value = value + " dB";
    }

    visualizeVolume(){
        let value = 0;
        for(const v of this.dataArray){
          value += v;
        }
    
        let average = value / this.bufferLength;
        this.shadowRoot.querySelector("#meterKnob").setValue(average);
    
    }

    fixRelativeImagePaths() {
        // change webaudiocontrols relative paths for spritesheets to absolute
        let webaudioControls = this.shadowRoot.querySelectorAll(
            'webaudio-knob, webaudio-slider, webaudio-switch, img'
        );
        webaudioControls.forEach((e) => {
            let currentImagePath = e.getAttribute('src');
            if (currentImagePath !== undefined) {
                //console.log("Got wc src as " + e.getAttribute("src"));
                let imagePath = e.getAttribute('src');
                //e.setAttribute('src', this.basePath  + "/" + imagePath);
                e.src = this.basePath + "/" + imagePath;
                //console.log("After fix : wc src as " + e.getAttribute("src"));
            }
        });
    }

    declareListeners() {
        this.shadowRoot.querySelector("#playButton").addEventListener("click", (event) => {
            this.play();
        });

        this.shadowRoot.querySelector("#pauseButton").addEventListener("click", (event) => {
            this.pause();
        });

        this.shadowRoot.querySelector("#toZeroButton").addEventListener("click", (event) => {
            this.toZero();
        });

        this.shadowRoot.querySelector("#knob-1").addEventListener("input", (event) => {
            this.setVolume(event.target.value);
        });

        this.shadowRoot.querySelector("#knobStereo").addEventListener("input", (event) => {
            this.setBalance(event.target.value);
        });

        this.shadowRoot.querySelector("#i0").addEventListener("input", (event) => {
            this.changeGain(event.target.value, 0);
        });

        this.shadowRoot.querySelector("#i1").addEventListener("input", (event) => {
            this.changeGain(event.target.value, 1);
        });

        this.shadowRoot.querySelector("#i2").addEventListener("input", (event) => {
            this.changeGain(event.target.value, 2);
        });

        this.shadowRoot.querySelector("#i3").addEventListener("input", (event) => {
            this.changeGain(event.target.value, 3);
        });

        this.shadowRoot.querySelector("#i4").addEventListener("input", (event) => {
            this.changeGain(event.target.value, 4);
        });

        this.shadowRoot.querySelector("#i5").addEventListener("input", (event) => {
            this.changeGain(event.target.value, 5);
        });

        this.player.addEventListener('timeupdate', (event) => {
            let p = this.shadowRoot.querySelector("#progressRuler");

            try {
                p.max = this.player.duration.toFixed(2);
                p.value = this.player.currentTime;
            } catch (err) {

            }
        })
    }

    //API
    setVolume(val) {
        this.player.volume = val;
    }

    setBalance(val) {
        this.pannerNode.pan.value = val;
    }

    play() {
        this.player.play();
    }

    pause() {
        this.player.pause();
    }

    toZero() {
        this.player.currentTime = 0;
    }


}

customElements.define("my-audioplayer", MyAudioPlayer);