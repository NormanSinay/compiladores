function dragOverHandler(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = "copy";
}

function dropHandler(event) {
  event.preventDefault();
  const file = event.dataTransfer.files[0];
  readFile(file);
}

function handleFile(files) {
  const file = files[0];
  readFile(file);
}

function readFile(file) {
  if (file.type.match("text.*")) {
    const reader = new FileReader();
    reader.onload = function (event) {
      const content = event.target.result;
      processContent(content);
    };
    reader.readAsText(file);
  } else {
    alert("Please drop a text file.");
  }
}

function processContent(content) {
  const lines = content.split("\n");
  let variables = [];
  let terminals = [];
  let originalContent = "";
  lines.forEach((line) => {
    if (line.trim() === "") return;
    const parts = line.split(":");
    if (parts.length !== 2) return;
    const variable = parts[0].trim();
    if (!isValidVariable(variable)) return;
    if (!variables.includes(variable)) {
      variables.push(variable);
    }

    const contentInsideQuotes = parts[1].match(/'([^']+)'/g);
    if (contentInsideQuotes) {
      contentInsideQuotes.forEach((item) => {
        const trimmedItem = item.replace(/'/g, "").trim();
        if (!terminals.includes(trimmedItem)) {
          terminals.push(trimmedItem);
        }
      });
    }

    const variablesInsideLine = parts[1]
      .split("|")
      .map((v) => v.trim().split(":")[0].trim());
    variablesInsideLine.forEach((v) => {
      const trimmedVariable = v.trim();
      const variableParts = trimmedVariable.split("S");
      variableParts.forEach((part) => {
        const validPart = part.replace(/[^\w|']/g, "");
        if (
          validPart !== "" &&
          validPart !== variable &&
          isValidVariable(validPart) &&
          !variables.includes(validPart) &&
          !isUpperCase(validPart)
        ) {
          variables.push(validPart);
        }
      });
    });
    originalContent += line + "\n";
  });

  displayVectors(variables, terminals, originalContent);
}

function isUpperCase(str) {
  return str === str.toUpperCase();
}

function isValidVariable(variable) {
  return /^[A-Z][^:]*$/.test(variable);
}

function displayVectors(variables, terminals, originalContent) {
  const fileContentDiv = document.getElementById("file-content");
  fileContentDiv.innerHTML =
    '<div class="vector"><h2>Original Content:</h2><pre>' +
    originalContent +
    "</pre></div>" +
    '<div class="vector"><h2>Variables:</h2><pre>' +
    variables.join("\n") +
    "</pre></div>" +
    '<div class="vector"><h2>Terminals:</h2><pre>' +
    terminals.join("\n") +
    "</pre></div>" +
    '<div class="vector"><h2>Transitions:</h2><pre>' +
    generateTransitions(originalContent) +
    "</pre></div>";

  const vectors = document.querySelectorAll(".vector");
  vectors.forEach((vector) => {
    vector.style.border = "1px solid black";
    vector.style.padding = "10px";
    vector.style.margin = "10px";
    vector.style.width = "calc(33.33% - 20px)";
    vector.style.float = "left";
  });
}

function generateTransitions(originalContent) {
  let transitions = "";
  const lines = originalContent.split("\n");
  lines.forEach((line) => {
    if (line.trim() === "") return;
    const parts = line.split(":");
    if (parts.length !== 2) return;
    const variable = parts[0].trim();
    const productions = parts[1].split("|");
    productions.forEach((production) => {
      transitions += variable + " -> " + production.trim() + "\n";
    });
  });
  return transitions;
}
