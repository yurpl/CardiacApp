import * as fs from "fs";
import document from "document";
import { PUSHUP_PROGRAM, MAX_OUT_INSTRUCTIONS, INITIAL_MAX_TEST_INSTRUCTIONS, RESET_MAX_INSTRUCTIONS } from "../common/globals.js";
import { Accelerometer } from "accelerometer";
import { Gyroscope } from "gyroscope";
import { HeartRateSensor } from "heart-rate";


let savedData = getSavedData();
doWorkoutSelectorPage()


if (Accelerometer) {
   console.log("This device has an Accelerometer!");
   const accelerometer = new Accelerometer({ frequency: 1 });
   accelerometer.addEventListener("reading", () => {
     console.log(`${accelerometer.x},${accelerometer.y},${accelerometer.z}`);
   });
   accelerometer.start();
} else {
   console.log("This device does NOT have an Accelerometer!");
}

if (Gyroscope) {
   console.log("This device has a Gyroscope!");
   const gyroscope = new Gyroscope({ frequency: 1 });
   gyroscope.addEventListener("reading", () => {
     console.log(
      `Gyroscope Reading: \
        timestamp=${gyroscope.timestamp}, \
        [${gyroscope.x}, \
        ${gyroscope.y}, \
        ${gyroscope.z}]`
     );
   });
   gyroscope.start();
} else {
   console.log("This device does NOT have a Gyroscope!");
}

if (HeartRateSensor) {
   console.log("This device has a HeartRateSensor!");
   const hrm = new HeartRateSensor();
   hrm.addEventListener("reading", () => {
     console.log(`Current heart rate: ${hrm.heartRate}`);
   });
   hrm.start();
} else {
   console.log("This device does NOT have a HeartRateSensor!");
}


function doMainMenuPage() {
  document.location.replace("index.view").then(() => {
    console.log(`Starting main menu page`)
    savedData = getSavedData();
    if( isEmpty(savedData)) {
      savedData["workoutIndex"] = 0
      savedData["currentMax"] = 0
      fs.writeFileSync("data.txt", savedData, "json");
      savedData = getSavedData();
    }
    console.log(`Loaded initial saved data`)

    // Menu Button
    let mainMenuButton = document.getElementById("main-menu-button")
    mainMenuButton.text = PUSHUP_PROGRAM[savedData["workoutIndex"]]["name"]
    mainMenuButton.onclick = function(evt) {
      console.log("Moving away from main page.")
      savedData = getSavedData();
      console.log("Starting workout with index " + savedData["workoutIndex"].toString());
      if( PUSHUP_PROGRAM[savedData["workoutIndex"]]["type"] == "workout") {
        let last_workout = false
        if (savedData["workoutIndex"]+1 == PUSHUP_PROGRAM.length) {
          last_workout = true
        }
        doWorkoutPage(
          PUSHUP_PROGRAM[savedData["workoutIndex"]]["name"],
          PUSHUP_PROGRAM[savedData["workoutIndex"]]["data"],
          PUSHUP_PROGRAM[savedData["workoutIndex"]]["rest"],
          savedData["currentMax"],
          last_workout
        );
      }
      else if (PUSHUP_PROGRAM[savedData["workoutIndex"]]["type"] == "maxout") {
        doMaxTestPage(PUSHUP_PROGRAM[savedData["workoutIndex"]]["name"], true)
      }
    }

    // Settings Button
    let settingsButton = document.getElementById("settings-button")
    settingsButton.onclick = function(evt) {
      doSettingsPage()
    }
  });
}

// Workout Selector
function doWorkoutSelectorPage() {
  console.log("Starting current workout selector page")
  document.location.assign("workout-select.view").then(() => {
    let workoutSelectorList= document.getElementById("workoutSelectorList");
    console.log(`${workoutSelectorList}`)

    workoutSelectorList.delegate = {
      getTileInfo: (index) => {
        return {
          type: "my-workout",
          value: "foo",
          index: index
        };
      },
      configureTile: (tile, info) => {
        console.log(`Item: ${info.index}`)
        if (info.type == "my-workout") {
          tile.getElementById("text").text = PUSHUP_PROGRAM[info.index]["name"];
          let touch = tile.getElementById("touch");
          touch.addEventListener("click", evt => {
            console.log(`touched: ${info.index}`);
            savedData = getSavedData();
            savedData["workoutIndex"] = info.index;
            fs.writeFileSync("data.txt", savedData, "json");
            console.log("Increased workout index to " + savedData["workoutIndex"].toString());
            doMainMenuPage()
          });
        }
      }
    };
    workoutSelectorList.length = PUSHUP_PROGRAM.length
  });
}


function doSettingsPage() {
  console.log("Starting settings page")
  document.location.assign("settings.view").then(() => {
    let backToMainButton = document.getElementById("settingsList").getElementById("btn-back-to-main").getElementById("touch");
    backToMainButton.addEventListener("click", (evt) => {
      console.log(`Back to main we go`);
      doMainMenuPage()
    });

    // Max Selector
   

    // Current Workout
    let workoutSelectorButton = document.getElementById("settingsList").getElementById("btn-workout-settings").getElementById("touch");
    workoutSelectorButton.addEventListener("click", (evt) => {
      console.log("Going to workout selector");
      doWorkoutSelectorPage();
    });
  });
}



function doWorkoutPage(name, data, rest, curr_max, last_workout) {
  document.location.assign("workout.view").then(() => {
    let workoutCount = document.getElementById("workoutCount");
    let workout = getWorkoutWithMax(data, curr_max);
    let instruction_string = `You will be doing this exercise with ${rest} seconds rest.\n\n` + workout.join(' / ')
    let header = document.getElementById("workoutHeader");
    header.text = name;
    let instructions = document.getElementById("workoutInstructions");
    instructions.text = instruction_string;
    let nextButton = document.getElementById("btn-workout-next");
    const myButton = document.getElementById("stop-button");
    nextButton.text = "Start workout!"
    myButton.text = "Stop workout!"
    let set = 1
    myButton.onclick = function(evt) {
      doWorkoutSelectorPage()
    }
    nextButton.onclick = function(evt) {
      nextButton.text = "Next set!"
      workoutCount.style.display="inline";
      instructions.text = "";
      workoutCount.text = workout[set-1]
      if(set == workout.length) {
        workoutCount.text = `${workoutCount.text}+`
        nextButton.text = "Finish!"
      }
      if(set > workout.length) {
        if (last_workout) {
          doFinishedPage()
        }
        else {
          savedData = getSavedData();
          savedData["workoutIndex"] = savedData["workoutIndex"] + 1
          fs.writeFileSync("data.txt", savedData, "json");
          console.log("Increased workout index to " + savedData["workoutIndex"].toString());
          doFinishedPage()
        }
      }
      header.text = "Set " + set.toString();
      set = set + 1
    }
  });
}



function doFinishedPage() {
  console.log("Starting finished page")
  document.location.assign("congrats.view").then(() => {
    let nextButton = document.getElementById("btn-workout-next");
    nextButton.text = "Next workout!"
    nextButton.onclick = function(evt) {
      doWorkoutSelectorPage()
    }
  });
}



function getWorkoutWithMax(data, curr_max) {
  let current_key_max = 0;
  for (let key in data) {
    let minimum = parseInt(key);
    if (curr_max > minimum && minimum > current_key_max) {
      current_key_max = minimum;
      console.log("We've found a new data set with key " + current_key_max.toString());
    }
  }
  return data[current_key_max.toString()];
}

function getSavedData() {
  let savedData = {}
  try {
    savedData = fs.readFileSync("data.txt", "json");
    return savedData
  }
  catch (e) {
    console.log("Could not find save data.")
  }
  return savedData;
}

function isEmpty(obj) {
  return Object.keys(obj).length === 0;
}

function getTumblerText(myObject) {
  return myObject.getElementById("item" + myObject.value).getElementById("my-value").text;
}