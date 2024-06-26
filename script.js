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
      hideDropArea();
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
  let productions = {};
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

    const productionsArray = parts[1]
      .split("|")
      .map((v) => v.replace(/'/g, "").trim());
    productions[variable] = productionsArray;
    originalContent += line + "\n";
  });

  const updatedProductions = eliminateLeftRecursion(productions);

  displayVectors(variables, terminals, originalContent, productions, updatedProductions);
}

function isUpperCase(str) {
  return str === str.toUpperCase();
}

function isValidVariable(variable) {
  return /^[A-Z][^:]*$/.test(variable);
}

function displayVectors(variables, terminals, originalContent, productions, updatedProductions) {
  const fileContentDiv = document.getElementById("file-content");
  fileContentDiv.innerHTML =
    '<div class="vector"><h4>Contenido Original</h4><pre>' +
    originalContent +
    "</pre></div>" +
    '<div class="vector"><h4>Variables</h4><pre>' +
    variables.join("\n") +
    "</pre></div>" +
    '<div class="vector"><h4>Terminales</h4><pre>' +
    terminals.join("\n") +
    "</pre></div>" +
    '<div class="vector"><h4>Producciones</h4>' +
    generateMatrixHTMLFromOriginalContent(originalContent) +
    "</div>" +
    '<div class="vector"><h4>Gramática Sin Recursividad</h4>' +
    generateProductionsHTML(updatedProductions) +
    "</div>" +
    generateLeftPartVectorFromProductions(updatedProductions) +
    generateTerminalsVector(updatedProductions) +
    '<div class="vector"><h4>Producciones Sin Recursividad</h4>' +
    generateMatrixHTML(updatedProductions) +
    "</div>";
}

function generateMatrixHTMLFromOriginalContent(originalContent) {
  let matrixHTML = '<div class="matrix">';
  const lines = originalContent.split("\n");
  lines.forEach((line) => {
    if (line.trim() === "") return;
    const parts = line.split(":");
    if (parts.length !== 2) return;
    const leftPart = parts[0].trim();
    const rightPart = parts[1].trim().split("|");
    rightPart.forEach((item) => {
      const trimmedItem = item.replace(/'/g, "").trim(); // Eliminar comillas simples
      matrixHTML += '<div class="row">';
      matrixHTML += '<div class="column">' + leftPart + "</div>";
      matrixHTML += '<div class="column">' + trimmedItem + "</div>";
      matrixHTML += "</div>";
    });
  });
  matrixHTML += "</div>";
  return matrixHTML;
}

function generateLeftPartVectorFromProductions(productions) {
  let leftPartVectorHTML =
    '<div class="vector"><h4>Variables</h4><pre>';
  const nonTerminals = new Set(Object.keys(productions));

  const uniqueNonTerminals = Array.from(nonTerminals).sort();
  uniqueNonTerminals.forEach((element) => {
    leftPartVectorHTML += element + "\n";
  });

  leftPartVectorHTML += "</pre></div>";
  return leftPartVectorHTML;
}

function generateTerminalsVector(productions) {
  const terminals = getTerminals(productions);
  let terminalsHTML =
    '<div class="vector"><h4>Terminales</h4><pre>';
  terminals.forEach((terminal) => {
    terminalsHTML += terminal + "\n";
  });
  terminalsHTML += "</pre></div>";
  return terminalsHTML;
}

function getTerminals(productions) {
  const terminals = new Set();
  Object.values(productions).forEach((productionsArray) => {
    productionsArray.forEach((production) => {
      const parts = production.split(/\s+/);
      parts.forEach((part) => {
        if (!/^[A-Z][A-Z0-9]*[!]*$/.test(part)) {
          terminals.add(part);
        }
      });
    });
  });
  return Array.from(terminals).sort();
}

function generateProductionsHTML(productions) {
  let productionsHTML = "<pre>";
  Object.keys(productions).forEach((nonTerminal) => {
    const productionsArray = productions[nonTerminal];
    if (Array.isArray(productionsArray)) {
      productionsHTML +=
        nonTerminal + " : " + productionsArray.join(" | ") + "\n";
    }
  });
  productionsHTML += "</pre>";
  return productionsHTML;
}

function generateMatrixHTML(productions) {
  let matrixHTML = '<div class="matrix">';
  Object.keys(productions).forEach((nonTerminal) => {
    const rightPart = productions[nonTerminal];
    rightPart.forEach((production) => {
      const trimmedItem = production.trim();
      matrixHTML += '<div class="row">';
      matrixHTML += '<div class="column">' + nonTerminal + "</div>";
      matrixHTML += '<div class="column">' + trimmedItem + "</div>";
      matrixHTML += "</div>";
    });
  });
  matrixHTML += "</div>";
  return matrixHTML;
}

function eliminateLeftRecursion(productions) {
  const nonTerminals = Object.keys(productions);
  for (let i = 0; i < nonTerminals.length; i++) {
    const Ai = nonTerminals[i];
    for (let j = 0; j < i; j++) {
      const Aj = nonTerminals[j];
      const AiProductions = productions[Ai];
      const AjProductions = productions[Aj];
      if (AiProductions && AjProductions) {
        const newProductions = [];
        const remainingProductions = [];
        AiProductions.forEach((production) => {
          if (production.startsWith(Aj)) {
            const gamma = production.substring(Aj.length);
            if (gamma === "") {
              newProductions.push("!");
            } else {
              AjProductions.forEach((AjProduction) => {
                newProductions.push(AjProduction + gamma);
              });
            }
          } else {
            remainingProductions.push(production);
          }
        });
        productions[Ai] = remainingProductions.concat(newProductions);
      }
    }
    const AiProductions = productions[Ai];
    const newProductions = [];
    const alphaProductions = [];
    AiProductions.forEach((production) => {
      if (production.startsWith(Ai)) {
        const alpha = production.substring(Ai.length);
        if (alpha === "") {
          newProductions.push("!");
        } else {
          alphaProductions.push(alpha);
        }
      } else {
        newProductions.push(production);
      }
    });
    if (alphaProductions.length > 0) {
      const primeVariable = Ai + "!";
      productions[primeVariable] = alphaProductions.map(
        (alpha) => alpha + primeVariable
      );
      productions[Ai] = newProductions.map(
        (production) => production + primeVariable
      );
    }
  }
  return productions;
}

function hideDropArea() {
  const dropArea = document.getElementById("drop-area");
  dropArea.style.display = "none";
  const fileContentDiv = document.getElementById("file-content");
  fileContentDiv.style.marginTop = "0"; // Ajustar el margen superior para subir el contenido
}

document.addEventListener("DOMContentLoaded", () => {
  const dropArea = document.getElementById("drop-area");
  dropArea.addEventListener("dragover", dragOverHandler);
  dropArea.addEventListener("drop", dropHandler);
  const fileInput = document.getElementById("file-input");
  fileInput.addEventListener("change", (event) => {
    handleFile(event.target.files);
  });
});
