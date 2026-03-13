document.addEventListener('DOMContentLoaded', () => {

  const form = document.getElementById('formChamado');
  const mensagemDiv = document.getElementById('mensagem');

  const GOOGLE_SHEETS_URL = "https://script.google.com/macros/s/AKfycby9AbSpe8BMKYutA2Q3L1OgzghOcd75GxHOskleo9qdiXZ5-4sR0ZDEn7ZnCaYkGaWw/exec";

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const nome = document.getElementById('nome').value.trim();
    const email = document.getElementById('email').value.trim();
    const motivo = document.getElementById('motivo').value.trim();
    const area = document.getElementById('area').value;

    if (!nome || !email || !motivo || !area) {
      alert("Preencha todos os campos.");
      return;
    }

    // Envia para o Google Sheets
    const formData = new FormData();
    formData.append("nome", nome);
    formData.append("email", email);
    formData.append("motivo", motivo);
    formData.append("area", area);

    await fetch(GOOGLE_SHEETS_URL, { method: "POST", body: formData });

    // Emails responsáveis por área
    const emailsArea = {
      TI_AGUA_SUL: "auxinformatica@vitaengenharia.com.br",
      TI_BARRA_FUNDA: "ti@vitaengenharia.com.br",
      TI_BARRA_FUNDA_2: "informatica@vitaengenharia.com.br",
      SUPORTE_TI: "suporte@vitaengenharia.com.br"
    };

    let responsavelEmail = emailsArea[area] || "";

    // Enviar e-mail
    if (responsavelEmail !== "") {

      emailjs.send("service_chamados", "template_4e1dwk8", {
        nome: nome,
        email: email,
        motivo: motivo,
        area: area,
        responsavel: responsavelEmail
      });

    }

    mensagemDiv.textContent = "Chamado enviado com sucesso!";
    mensagemDiv.classList.remove('hidden');

    form.reset();
  });


  // Botão acessar painel
  document.getElementById("btnPainel").addEventListener("click", () => {

    const senhaCorreta = "Vita123";
    const senha = prompt("Digite a senha para acessar o painel:");

    if (senha === senhaCorreta) {
      window.location.href = "painel.html";
    } 
    
    else if (senha === null) {
      alert("Acesso cancelado.");
    } 
    
    else {
      alert("Senha incorreta!");
    }

  });

});