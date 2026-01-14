const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vStPJ-dLKm5eh2GSriXgHf0g_icP_TLVej5O0gaoivM-vUU1W7_qcXlzT4pTJvJcm7DHVQ2OmbtnmVq/pub?gid=0&single=true&output=csv";
const API_URL = "https://script.google.com/macros/s/AKfycby9AbSpe8BMKYutA2Q3L1OgzghOcd75GxHOskleo9qdiXZ5-4sR0ZDEn7ZnCaYkGaWw/exec";

let painelResetado = false;

async function carregarChamados() {
  if (painelResetado) return;

  const tabela = document.querySelector("#tabelaChamados tbody");

  try {
    const csvTexto = await fetch(CSV_URL).then(r => r.text());
    const parsed = Papa.parse(csvTexto, { header: true, skipEmptyLines: true });

    tabela.innerHTML = "";

    parsed.data.forEach(linha => {
      const id = linha.ID || "";
      const data = linha.data || "";
      const nome = linha.nome || "";
      const email = linha.email || "";
      const area = linha.area || "";
      const status = linha.status || "";

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${id}</td>
        <td>${data}</td>
        <td>${nome}</td>
        <td>${email}</td>
        <td>${area}</td>
        <td class="status">${status}</td>
        <td>
          <select class="alterarStatus" data-id="${id}">
            <option value="Aberto" ${status==="Aberto"?"selected":""}>Aberto</option>
            <option value="Em andamento" ${status==="Em andamento"?"selected":""}>Em andamento</option>
            <option value="Concluído" ${status==="Concluído"?"selected":""}>Concluído</option>
          </select>
        </td>
      `;
      tabela.appendChild(tr);
    });
  } catch(err) {
    console.error("Erro ao carregar CSV:", err);
    alert("Erro ao carregar chamados.");
  }
}

document.addEventListener("change", async e => {
  if (e.target.classList.contains("alterarStatus")) {
    const id = e.target.dataset.id;
    const status = e.target.value;

    try {
      const resp = await fetch(API_URL, {
        method: "POST",
        body: new URLSearchParams({ atualizarStatus:"true", id, status })
      });
      const json = await resp.json();

      if (json && json.sucesso) {
        e.target.closest("tr").querySelector(".status").textContent = status;
        mostrarMensagem(`Status do chamado ${id} atualizado para "${status}"`);
      } else alert("Erro ao atualizar status.");
    } catch(err) {
      console.error(err);
      alert("Erro ao atualizar status.");
    }
  }
});

document.getElementById("resetPainel").addEventListener("click", () => {
  document.querySelector("#tabelaChamados tbody").innerHTML = "";
  painelResetado = true;
  mostrarMensagem("Painel resetado!");
});

document.getElementById("recarregarPainel").addEventListener("click", () => {
  painelResetado = false;
  carregarChamados();
  mostrarMensagem("Painel recarregado!");
});

function mostrarMensagem(msg){
  let div = document.getElementById("mensagemPainel");
  if(!div){
    div = document.createElement("div");
    div.id = "mensagemPainel";
    div.style.cssText = "position:fixed;top:20px;right:20px;background:#c8e6c9;color:#2e7d32;padding:12px 18px;border-radius:6px;box-shadow:0 3px 8px rgba(0,0,0,0.2);font-weight:bold;z-index:9999;";
    document.body.appendChild(div);
  }
  div.textContent = msg;
  div.style.display = "block";
  setTimeout(()=>{div.style.display="none"},3000);
}

document.getElementById("filtro").addEventListener("input", function(){
  const termo = this.value.toLowerCase();
  document.querySelectorAll("#tabelaChamados tbody tr").forEach(tr=>{
    tr.style.display = tr.innerText.toLowerCase().includes(termo)?"":"none";
  });
});

carregarChamados();
