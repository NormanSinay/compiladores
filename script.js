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
  let terminales = [];
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

    const contentInsideQuotes = parts[1].match(/'[^']*'/g);
    if (contentInsideQuotes) {
      contentInsideQuotes.forEach((item) => {
        const trimmedItem = item.replace(/'/g, "").trim();
        if (trimmedItem.toLowerCase() !== "e" && !isUpperCase(trimmedItem)) {
          if (!terminales.includes(trimmedItem)) {
            terminales.push(trimmedItem);
          }
        }
      });
    }

    const variablesInsideLine = parts[1]
      .split("|")
      .map((v) => v.trim().split(":")[0].trim());
    variablesInsideLine.forEach((v) => {
      const trimmedVariable = v.trim();
      if (
        trimmedVariable !== "" &&
        trimmedVariable !== variable &&
        isValidVariable(trimmedVariable) &&
        !variables.includes(trimmedVariable) &&
        !isUpperCase(trimmedVariable)
      ) {
        variables.push(trimmedVariable);
      }
    });

    // Agregar la línea original al contenido original
    originalContent += line + "\n";
  });

  displayVectors(variables, terminales, originalContent);
}

function isUpperCase(str) {
  return str === str.toUpperCase();
}

function isValidVariable(variable) {
  return /^[A-Z][^:]*$/.test(variable);
}

function displayVectors(variables, terminales, originalContent) {
  const fileContentDiv = document.getElementById("file-content");
  fileContentDiv.innerHTML =
    '<div class="vector"><h2>Contenido Original:</h2><pre>' +
    originalContent +
    "</pre></div>" +
    '<div class="vector"><h2>Variables:</h2><pre>' +
    variables.join("\n") +
    "</pre></div>" +
    '<div class="vector"><h2>Terminales:</h2><pre>' +
    terminales.join("\n") +
    "</pre></div>";

  // Aplicar estilos de cuadrícula
  const vectors = document.querySelectorAll(".vector");
  vectors.forEach((vector) => {
    vector.style.border = "1px solid black";
    vector.style.padding = "10px";
    vector.style.margin = "10px";
    vector.style.width = "calc(33.33% - 20px)";
    vector.style.float = "left";
  });
}
