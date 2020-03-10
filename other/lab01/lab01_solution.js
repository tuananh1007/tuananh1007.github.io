// The last played key number
var last_key_number = -1;

// Map the key with the key number
var key_mapping = {
    // White keys of the first octave
    "z":  0, "x":  2, "c":  4, "v":  5, "b":  7, "n":  9, "m": 11,
    // Black keys of the first octave
    "s":  1, "d":  3, "g":  6, "h":  8, "j": 10,
    // White keys of the second octave
    "w": 12, "e": 14, "r": 16, "t": 17, "y": 19, "u": 21, "i": 23,
    // Black keys of the second octave
    "3": 13, "4": 15, "6": 18, "7": 20, "8": 22
}

function handleNoteOn(key_number) {
    // Find the pitch
    var lowest_pitch = parseInt($("#lowest-pitch").val());
    var pitch = lowest_pitch + key_number;

    // Extract the amplitude value from the slider
    var amplitude = parseInt($("#amplitude").val());

    // Use the two numbers to start a MIDI note
    MIDI.noteOn(0, pitch, amplitude);

    // Handle the chord mode
    var play_mode = $(":radio[name=play-mode]:checked").val();
    if (play_mode == "major") {
        MIDI.noteOn(0, pitch + 4, amplitude);
        MIDI.noteOn(0, pitch + 7, amplitude);
    }
    else if (play_mode == "minor") {
        MIDI.noteOn(0, pitch + 3, amplitude);
        MIDI.noteOn(0, pitch + 7, amplitude);
    }
}

function handleNoteOff(key_number) {
    // Find the pitch
    var lowest_pitch = parseInt($("#lowest-pitch").val());
    var pitch = lowest_pitch + key_number;

    // Send the note off message for the pitch
    MIDI.noteOff(0, pitch); 

    // Handle the chord mode
    var play_mode = $(":radio[name=play-mode]:checked").val();
    if (play_mode == "major") {
        MIDI.noteOff(0, pitch + 4);
        MIDI.noteOff(0, pitch + 7);
    }
    else if (play_mode == "minor") {
        MIDI.noteOff(0, pitch + 3);
        MIDI.noteOff(0, pitch + 7);
    }
}

function handlePianoMouseDown(evt) {
    // Determine which piano key has been clicked on
    // evt.target tells us which item triggered this function
    // The piano key number is extracted from the key id (0-23)
    var key_number = $(evt.target).attr("id").substring(4);
    key_number = parseInt(key_number);

    // Start the note
    handleNoteOn(key_number);

    // Show a simple message in the console
    console.log("Piano mouse down event for key " + key_number + "!");

    // Remember the key number
    last_key_number = key_number;
}

function handlePianoMouseUp(evt) {
    // last_key_number is used because evt.target does not necessarily
    // equal to the key that has been clicked on 
    if (last_key_number < 0) return;
    
    // Stop the note
    handleNoteOff(last_key_number);

    // Show a simple message in the console
    console.log("Piano mouse up event for key " + last_key_number + "!");

    // Reset the key number
    last_key_number = -1;
}

function handlePageKeyDown(evt) {
    // Exit the function if the key is not a piano key
    // evt.key tells us the key that has been pressed
    if (!(evt.key in key_mapping)) return;
    
    // Find the key number of the key that has been pressed
    var key_number = key_mapping[evt.key];
    if (key_number == last_key_number) return;

    // Start the note
    handleNoteOn(key_number);

    // Select the key
    $("#key-" + key_number).focus();

    // Show a simple message in the console
    console.log("Page key down event for key " + key_number + "!");

    // Remember the key number
    last_key_number = key_number;
}

function handlePageKeyUp(evt) {
    // Exit the function if the key is not a piano key
    // evt.key tells us the key that has been released
    if (!(evt.key in key_mapping)) return;
    
    // Find the key number of the key that has been released
    var key_number = key_mapping[evt.key];

    // Stop the note
    handleNoteOff(key_number);

    // Show a simple message in the console
    console.log("Page key up event for key " + key_number + "!");

    // Reset the key number
    last_key_number = -1;
}

function handleInstrumentChange() {
    var index = parseInt($("#instrument").val());
    MIDI.programChange(0, index);
  
    // Show a simple message in the console
    console.log("Change event for instrument " + index + "!");
}

$(document).ready(function() {
    $("#loading").modal({ backdrop: "static", keyboard: false, show: true });

    MIDI.loadPlugin({
        soundfontUrl: "./midi-js/soundfont/",
        instruments: [
            "trumpet"
        ],
        onprogress: function(state, progress) {
            console.log(state, progress);
        },
        onsuccess: function() {
            // Resuming the AudioContext when there is user interaction
            $("body").click(function() {
                if (MIDI.getContext().state != "running") {
                    MIDI.getContext().resume().then(function() {
                        console.log("Audio Context is resumed!");
                    });
                }
            });

            // Finish loading the page
            $("#loading").modal("hide");

            // At this point the MIDI system is ready
            MIDI.setVolume(0, 127);     // Set the volume level
            MIDI.programChange(0, 56);  // Use the General MIDI 'trumpet' number

            // Set up the event handlers for all the buttons
            $("button").on("mousedown", handlePianoMouseDown);
            $("button").on("mouseup", handlePianoMouseUp);

            // Set up key events
            $(document).keydown(handlePageKeyDown);
            $(document).keyup(handlePageKeyUp);

            // Set up the value and event handler for the instrument
            $("#instrument").val("56");
            $("#instrument").change(handleInstrumentChange);
        }
    });
});
