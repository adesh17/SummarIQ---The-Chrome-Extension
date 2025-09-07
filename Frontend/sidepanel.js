// // document.addEventListener('DOMContentLoaded', ()=>{
// //   chrome.storage.local.get(['researchNotes'], function(result){

// //     if(result.researchNotes)
// //       document.getElementById('notes').value = result.researchNotes;
// //   });

// //   document.getElementById('summarizeBtn').addEventListener('click',summarizeText);
// //   document.getElementById('saveNotesBtn').addEventListener('click',saveNotes);

// // });

// // async function summarizeText() {
  
// //   try {
    
// //     const [tab] = await chrome.tabs.query( {active:true , currentWindow: true} )

// //     const [{result}] = await chrome.scripting.executeScript({

// //       target: {tabId: tab.id},

// //       function:()=> window.getSelection().toString()
// //     })

// //     if(!result)
// //     {
// //       showResult('please Select Some text first')
// //       return
// //     }

// //     const response=await fetch('http://localhost:8080/research/process' , {

// //       method:'POST',
// //       headers:{'Content-Type':'application/json' },
// //       body: JSON.stringify({content:result, operation:'summarize'})
// //     })

// //     if(!response.ok)
// //     {
// //       throw new Error(`Api Error: ${response.status}`)
// //     }

// //     const text=await response.text();

// //     showResult(text.replace(/\n/g,'<br>'))

// //   } catch (error) {

// //     showResult('Error:'+error.message)
    
// //   }
// // }

// // async function saveNotes() {
  
// //   const notes =document.getElementById('notes').value
// //   chrome.storage.local.set({'researchNotes':notes}, function() {
// //     alert('Notes Saved Successfully')
// //   })
// // }


// // // function showResult(content)
// // // {
// // //   document.getElementById('results').innerHTML = 

// // //   `<div class="result"><div class="result-message">${content}</div></div>`
// // // }
// // function showResult(content, sender = "ai") {
// //   const className = sender === "user" ? "result-message result-user" : "result-message result-ai";
// //   document.getElementById('results').innerHTML +=
// //     `<div class="result"><div class="${className}">${content}</div></div>`;
// // }


// document.addEventListener('DOMContentLoaded', () => {
//   chrome.storage.local.get(['researchNotes'], function (result) {
//     if (result.researchNotes)
//       document.getElementById('notes').value = result.researchNotes;
//   });

//   document.getElementById('summarizeBtn').addEventListener('click', summarizeText);
//   document.getElementById('saveNotesBtn').addEventListener('click', saveNotes);
// });

// async function summarizeText() {
//   try {
//     const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

//     const [{ result }] = await chrome.scripting.executeScript({
//       target: { tabId: tab.id },
//       function: () => window.getSelection().toString()
//     });

//     if (!result) {
//       showResult('Please select some text first', "ai");
//       return;
//     }

//     const response = await fetch('http://localhost:8080/research/process', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ content: result, operation: 'summarize' })
//     });

//     if (!response.ok) {
//       throw new Error(`API Error: ${response.status}`);
//     }

//     const text = await response.text();
//     showResult(text, "ai");

//   } catch (error) {
//     showResult('Error: ' + error.message, "ai");
//   }
// }

// async function saveNotes() {
//   const notes = document.getElementById('notes').value;
//   chrome.storage.local.set({ 'researchNotes': notes }, function () {
//     alert('Notes Saved Successfully');
//   });
// }

// /* --------- New: Format AI Response --------- */
// function formatResponse(text) {
//   // Remove intro lines like "Okay, here's..."
//   text = text.replace(/^.*?(Spring Boot:)/i, "Spring Boot:");

//   // Convert section titles (**Title:**) into <h3>
//   text = text.replace(/\*\*(.*?)\:\*\*/g, "<h3>$1</h3>");

//   // Convert bold (**word**) into <strong>
//   text = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

//   // Convert * bullet points into list items
//   text = text.replace(/^\s*\*\s+(.*)$/gm, "<li>$1</li>");

//   // Wrap list items inside <ul>
//   if (text.includes("<li>")) {
//     text = text.replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>");
//   }

//   // Replace newlines with <br>
//   text = text.replace(/\n/g, "<br>");

//   return text;
// }

// /* --------- Updated showResult --------- */
// function showResult(content, sender = "ai") {
//   const formatted = sender === "ai" ? formatResponse(content) : content;
//   const className = sender === "user"
//     ? "result-message result-user"
//     : "result-message result-ai";

//   document.getElementById('results').innerHTML +=
//     `<div class="result"><div class="${className}">${formatted}</div></div>`;
// }

document.addEventListener('DOMContentLoaded', () => {
  // Load user notes
  chrome.storage.local.get(['researchNotes'], function (result) {
    if (result.researchNotes)
      document.getElementById('notes').value = result.researchNotes;
  });

  // Load Gemini responses if needed (not shown immediately)
  chrome.storage.local.get(['geminiResponses'], function (result) {
    if (!result.geminiResponses) {
      chrome.storage.local.set({ geminiResponses: [] });
    }
  });

  document.getElementById('summarizeBtn').addEventListener('click', summarizeText);
  document.getElementById('saveNotesBtn').addEventListener('click', saveNotes);
  document.getElementById('downloadNotesBtn').addEventListener('click', downloadGeminiResponses);
});

/* -------- Summarize Selected Text -------- */
async function summarizeText() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: () => window.getSelection().toString()
    });

    if (!result) {
      showResult('Please select some text first', "ai");
      return;
    }

    const response = await fetch('http://localhost:8080/research/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: result, operation: 'summarize' })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const text = await response.text();

    // Save Gemini response into storage
    chrome.storage.local.get(['geminiResponses'], function (res) {
      const responses = res.geminiResponses || [];
      responses.push(text);
      chrome.storage.local.set({ geminiResponses: responses });
    });

    showResult(text, "ai");

  } catch (error) {
    showResult('Error: ' + error.message, "ai");
  }
}

/* -------- Save User Notes -------- */
async function saveNotes() {
  const notes = document.getElementById('notes').value;
  chrome.storage.local.set({ 'researchNotes': notes }, function () {
    alert('Notes Saved Successfully');
  });
}

/* -------- Download Gemini Responses -------- */
async function downloadGeminiResponses() {
  chrome.storage.local.get(['geminiResponses'], function (res) {
    const responses = res.geminiResponses || [];

    if (responses.length === 0) {
      alert("No Gemini responses available to download!");
      return;
    }

    let content = "Gemini Responses:\n\n";
    responses.forEach((resp, index) => {
      content += `Response ${index + 1}:\n${resp}\n\n`;
    });

    // Create a Blob for Word file
    const blob = new Blob([content], { type: "application/msword" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "Gemini_Responses.doc";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
}

/* -------- Format AI Response -------- */
function formatResponse(text) {
  text = text.replace(/^.*?(Spring Boot:)/i, "Spring Boot:");
  text = text.replace(/\*\*(.*?)\:\*\*/g, "<h3>$1</h3>");
  text = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/^\s*\*\s+(.*)$/gm, "<li>$1</li>");
  if (text.includes("<li>")) {
    text = text.replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>");
  }
  text = text.replace(/\n/g, "<br>");
  return text;
}

/* -------- Show Response in UI -------- */
function showResult(content, sender = "ai") {
  const formatted = sender === "ai" ? formatResponse(content) : content;
  const className = sender === "user"
    ? "result-message result-user"
    : "result-message result-ai";

  document.getElementById('results').innerHTML +=
    `<div class="result"><div class="${className}">${formatted}</div></div>`;
}
