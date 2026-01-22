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
      const id = (linha.ID || "").trim();
      const data = (linha.data || "").trim();
      const nome = (linha.nome || "").trim();
      const email = (linha.email || "").trim();
      const area = (linha.area || "").trim();
      const status = (linha.status || "").trim();

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
            <option value="Avaliar" ${status==="Avaliar"?"selected":""}>Avaliar</option>
          </select>
        </td>
      `;
      tabela.appendChild(tr);
    });
  } catch (err) {
    console.error("Erro ao carregar CSV:", err);
    alert("Erro ao carregar chamados.");
  }
}

document.addEventListener("change", async (e) => {
  if (!e.target.classList.contains("alterarStatus")) return;

  const select = e.target;
  const tr = select.closest("tr");

  const id = select.dataset.id;
  const novoStatus = select.value;

  // dados do solicitante (pra e-mail)
  const nome = tr.children[2].textContent.trim();   // coluna Nome
  const email = tr.children[3].textContent.trim();  // coluna Email
  const area = tr.children[4].textContent.trim();   // coluna Área

  const statusAnterior = tr.querySelector(".status").textContent.trim();

  try {
    // 1) Atualiza status na planilha (Apps Script)
    const resp = await fetch(API_URL, {
      method: "POST",
      body: new URLSearchParams({ atualizarStatus: "true", id, status: novoStatus })
    });

    const json = await resp.json();

    if (json && json.sucesso) {
      // 2) Atualiza status na tela
      tr.querySelector(".status").textContent = novoStatus;
      mostrarMensagem(`Status do chamado ${id} atualizado para "${novoStatus}"`);

      // 3) Se virou "Avaliar", envia e-mail para o solicitante (uma vez)
      if (novoStatus === "Avaliar" && statusAnterior !== "Avaliar") {
        // Garantia: EmailJS carregado no painel.html
        if (typeof emailjs === "undefined") {
          console.error("EmailJS não carregado no painel.html");
          alert("EmailJS não carregado. Adicione o script do EmailJS no painel.html.");
          return;
        }

        await emailjs.send("service_vita", "template_avaliar_chamado", {
          to_email: email,     // no template, o To precisa ser {{to_email}}
          nome: nome,
          chamado_id: id,
          area: area
        });

        mostrarMensagem(`E-mail de avaliação enviado para ${email}`);
      }
    } else {
      alert("Erro ao atualizar status.");
      // volta o select pro status antigo
      select.value = statusAnterior || "Aberto";
    }
  } catch (err) {
    console.error(err);
    alert("Erro ao atualizar status.");
    select.value = statusAnterior || "Aberto";
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

function mostrarMensagem(msg) {
  let div = document.getElementById("mensagemPainel");
  if (!div) {
    div = document.createElement("div");
    div.id = "mensagemPainel";
    div.style.cssText =
      "position:fixed;top:20px;right:20px;background:#c8e6c9;color:#2e7d32;padding:12px 18px;border-radius:6px;box-shadow:0 3px 8px rgba(0,0,0,0.2);font-weight:bold;z-index:9999;";
    document.body.appendChild(div);
  }
  div.textContent = msg;
  div.style.display = "block";
  setTimeout(() => { div.style.display = "none"; }, 3000);
}

document.getElementById("filtro").addEventListener("input", function () {
  const termo = this.value.toLowerCase();
  document.querySelectorAll("#tabelaChamados tbody tr").forEach(tr => {
    tr.style.display = tr.innerText.toLowerCase().includes(termo) ? "" : "none";
  });
});

carregarChamados();
