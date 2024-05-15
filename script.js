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

    const productionsArray = parts[1].split("|").map((v) => v.trim());
    productions[variable] = productionsArray;
    originalContent += line + "\n";
  });

  // Call function to eliminate left recursion
  productions = eliminateLeftRecursion(productions);

  displayVectors(variables, terminals, originalContent, productions);
}

function isUpperCase(str) {
  return str === str.toUpperCase();
}

function isValidVariable(variable) {
  return /^[A-Z][^:]*$/.test(variable);
}

function displayVectors(variables, terminals, originalContent, productions) {
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
    generateMatrixHTML(originalContent) +
    "</div>" +
    '<div class="vector"><h4>Gramática Sin Recursividad</h4>' +
    generateProductionsHTML(productions) +
    "</div>" +
    '<div class="additional-vector" id="sin-recursion"><h4>Matriz Producciones Sin Recursividad por la Izquierda</h4><p>This is a new section parallel to "Grammar Without Recursion".</p></div>'; // New div added here
}


function generateMatrixHTML(originalContent) {
  let matrixHTML = '<div class="matrix">';
  const lines = originalContent.split("\n");
  lines.forEach((line) => {
    if (line.trim() === "") return;
    const parts = line.split(":");
    if (parts.length !== 2) return;
    const leftPart = parts[0].trim();
    const rightPart = parts[1].trim().split("|");
    rightPart.forEach((item) => {
      const trimmedItem = item.replace(/'/g, "").trim();
      matrixHTML += '<div class="row">';
      matrixHTML += '<div class="column">' + leftPart + "</div>";
      matrixHTML += '<div class="column">' + trimmedItem + "</div>";
      matrixHTML += "</div>";
    });
  });
  matrixHTML += "</div>";
  return matrixHTML;
}

function generateProductionsHTML(productions) {
  let productionsHTML = "<pre>";
  let matrixHTML = '<div class="matrix">';
  let matrixContent = "Matrix Without Recursion\n";

  Object.keys(productions).forEach((nonTerminal) => {
    const productionsArray = productions[nonTerminal];
    if (Array.isArray(productionsArray)) {
      const productionsWithoutMarks = productionsArray.map((production) => {
        // Replace single quotes with ! for uppercase characters before the colon
        // Remove single quotes for lowercase characters before the colon
        return production.replace(/([A-Z])'|([a-z])'/g, "$1!$2");
      });
      productionsHTML +=
        nonTerminal + ":" + productionsWithoutMarks.join(" | ") + "\n";

      // Generating matrix HTML
      productionsWithoutMarks.forEach((production) => {
        const parts = production.split(":");
        if (parts.length === 2) {
          const leftPart = parts[0].trim();
          const rightPart = parts[1].trim();
          matrixContent += leftPart + " : " + rightPart + "\n";
        }
      });
    }
  });

  productionsHTML += "</pre>";
  matrixHTML += "</div>";

  // Appending matrix HTML to existing div with id "file-content"
  const fileContentDiv = document.getElementById("file-content");
  fileContentDiv.innerHTML +=
    productionsHTML + '<div class="matrix-container">' + matrixContent + '</div>';

  return productionsHTML;
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
              // Case 1: Empty production, add epsilon
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
    // Remove immediate left recursion from Ai productions
    const AiProductions = productions[Ai];
    const newProductions = [];
    const alphaProductions = [];
    AiProductions.forEach((production) => {
      if (production.startsWith(Ai)) {
        const alpha = production.substring(Ai.length);
        if (alpha === "") {
          // Case 2: Derives epsilon, add epsilon
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

document.addEventListener("DOMContentLoaded", () => {
  const dropArea = document.getElementById("drop-area");
  dropArea.addEventListener("dragover", dragOverHandler);
  dropArea.addEventListener("drop", dropHandler);
  const fileInput = document.getElementById("file-input");
  fileInput.addEventListener("change", (event) => {
    handleFile(event.target.files);
  });
});
