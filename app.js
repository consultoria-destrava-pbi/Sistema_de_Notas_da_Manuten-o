// Sistema de Notas de Manutenção TEG
// Arquitetura preparada para ser migrada para Firebase, SharePoint ou SQL Server no futuro
// mantendo compatibilidade com GitHub Pages, sem backend.

const STORAGE_KEY = "tegNotasManutencao";
const DEFAULT_STATUS = "Concluído";
const DEFAULT_EDT = "NÃO";

let registros = [];
let fotosTemporarias = [];
let galeriaAtual = [];
let indiceFotoAtual = 0;

const elementos = {
  formulario: document.getElementById("formRegistro"),
  numeroRegistro: document.getElementById("numeroRegistro"),
  data: document.getElementById("data"),
  turno: document.getElementById("turno"),
  periodo: document.getElementById("periodo"),
  colaborador: document.getElementById("colaborador"),
  equipamento: document.getElementById("equipamento"),
  local: document.getElementById("local"),
  problema: document.getElementById("problema"),
  causa: document.getElementById("causa"),
  solucao: document.getElementById("solucao"),
  edt: document.getElementById("edt"),
  tempoEdt: document.getElementById("tempoEdt"),
  status: document.getElementById("status"),
  fotoInput: document.getElementById("foto"),
  fotoPreviewContainer: document.getElementById("fotoPreviewContainer"),
  btnSalvarRegistro: document.getElementById("btnSalvarRegistro"),
  btnLimparFormulario: document.getElementById("btnLimparFormulario"),
  btnExportarExcel: document.getElementById("btnExportarExcel"),
  btnExportarPDF: document.getElementById("btnExportarPDF"),
  filtroDataInicial: document.getElementById("filtroDataInicial"),
  filtroDataFinal: document.getElementById("filtroDataFinal"),
  filtroTurno: document.getElementById("filtroTurno"),
  filtroEquipamento: document.getElementById("filtroEquipamento"),
  filtroStatus: document.getElementById("filtroStatus"),
  filtroBusca: document.getElementById("filtroBusca"),
  tabelaHist: document.querySelector("#tabelaHistorico tbody"),
  totalRegistros: document.getElementById("totalRegistros"),
  totalConcluidos: document.getElementById("totalConcluidos"),
  totalPendentes: document.getElementById("totalPendentes"),
  totalEdt: document.getElementById("totalEdt"),
  tempoTotalEdt: document.getElementById("tempoTotalEdt"),
  lightbox: document.getElementById("lightbox"),
  lightboxImage: document.getElementById("lightboxImage"),
  fecharLightbox: document.getElementById("fecharLightbox"),
  btnFotoAnterior: document.getElementById("btnFotoAnterior"),
  btnFotoProxima: document.getElementById("btnFotoProxima")
};

function inicializarAplicacao() {
  if (!document.body) return;

  carregarRegistrosDoStorage();
  configurarEventos();
  popularDataAtual();
  atualizarNumeroRegistro();
  renderizarDashboard();
  renderizarTabela();
  limparFormulario();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", inicializarAplicacao);
} else {
  inicializarAplicacao();
}

function configurarEventos() {
  if (!elementos.btnSalvarRegistro || !elementos.btnLimparFormulario) {
    console.warn("Elementos principais do formulário não encontrados.");
    return;
  }

  elementos.btnSalvarRegistro.addEventListener("click", salvarRegistro);
  elementos.btnLimparFormulario.addEventListener("click", limparFormulario);

  if (elementos.btnExportarExcel) elementos.btnExportarExcel.addEventListener("click", exportarExcel);
  if (elementos.btnExportarPDF) elementos.btnExportarPDF.addEventListener("click", exportarPDF);

  if (elementos.fotoInput) elementos.fotoInput.addEventListener("change", tratarSelecaoDeFotos);

  if (elementos.filtroDataInicial) elementos.filtroDataInicial.addEventListener("input", renderizarTabela);
  if (elementos.filtroDataFinal) elementos.filtroDataFinal.addEventListener("input", renderizarTabela);
  if (elementos.filtroTurno) elementos.filtroTurno.addEventListener("change", renderizarTabela);
  if (elementos.filtroEquipamento) elementos.filtroEquipamento.addEventListener("input", renderizarTabela);
  if (elementos.filtroStatus) elementos.filtroStatus.addEventListener("change", renderizarTabela);
  if (elementos.filtroBusca) elementos.filtroBusca.addEventListener("input", renderizarTabela);

  if (elementos.fecharLightbox) elementos.fecharLightbox.addEventListener("click", fecharLightbox);
  if (elementos.btnFotoAnterior) elementos.btnFotoAnterior.addEventListener("click", irParaFotoAnterior);
  if (elementos.btnFotoProxima) elementos.btnFotoProxima.addEventListener("click", irParaFotoProxima);

  if (elementos.lightbox) {
    elementos.lightbox.addEventListener("click", (event) => {
      if (event.target === elementos.lightbox) {
        fecharLightbox();
      }
    });
  }

  document.addEventListener("keydown", (event) => {
    if (!elementos.lightbox || elementos.lightbox.classList.contains("hidden")) return;

    if (event.key === "Escape") fecharLightbox();
    if (event.key === "ArrowRight") irParaFotoProxima();
    if (event.key === "ArrowLeft") irParaFotoAnterior();
  });

  if (elementos.tabelaHist) {
    elementos.tabelaHist.addEventListener("click", (event) => {
      const alvo = event.target;

      if (alvo.matches(".foto-mini")) {
        const registroNumero = Number(alvo.dataset.registro);
        const indice = Number(alvo.dataset.indice || 0);
        abrirGaleria(registroNumero, indice);
      }
    });
  }
}

function carregarRegistrosDoStorage() {
  try {
    const dados = localStorage.getItem(STORAGE_KEY);
    registros = dados ? JSON.parse(dados) : [];
  } catch (error) {
    console.error("Erro ao buscar registros em localStorage:", error);
    registros = [];
  }

  if (!Array.isArray(registros)) registros = [];
}

function persistirRegistros() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(registros));
  } catch (error) {
    console.error("Erro ao salvar registros em localStorage:", error);
    alert("Não foi possível salvar localmente. Verifique se o navegador permitiu armazenamento local.");
  }
}

function formatarDataParaInput(data) {
  if (!data) return "";

  if (data.includes("-")) return data;

  if (data.includes("/")) {
    const [dia, mes, ano] = data.split("/");
    if (dia && mes && ano) return `${ano}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
  }

  const parsed = new Date(data + "T00:00:00");
  if (Number.isNaN(parsed.getTime())) return "";

  const ano = parsed.getFullYear();
  const mes = String(parsed.getMonth() + 1).padStart(2, "0");
  const dia = String(parsed.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function formatarDataParaBrasil(data) {
  if (!data) return "";

  if (data.includes("/")) return data;

  if (data.includes("-")) {
    const [ano, mes, dia] = data.split("-");
    if (ano && mes && dia) return `${dia}/${mes}/${ano}`;
  }

  const parsed = new Date(data + "T00:00:00");
  if (Number.isNaN(parsed.getTime())) return data;

  const ano = parsed.getFullYear();
  const mes = String(parsed.getMonth() + 1).padStart(2, "0");
  const dia = String(parsed.getDate()).padStart(2, "0");
  return `${dia}/${mes}/${ano}`;
}

function popularDataAtual() {
  const hoje = new Date();
  const dia = String(hoje.getDate()).padStart(2, "0");
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const ano = hoje.getFullYear();

  if (elementos.data) {
    elementos.data.value = `${ano}-${mes}-${dia}`;
  }
}

function obterProximoNumeroRegistro() {
  const maiorRegistro = registros.reduce((maior, atual) => {
    const numeroAtual = Number(atual.Registro || 0);
    return Math.max(maior, numeroAtual);
  }, 0);

  return maiorRegistro + 1;
}

function formatarNumeroRegistro(numero) {
  return String(numero).padStart(5, "0");
}

function atualizarNumeroRegistro() {
  if (!elementos.numeroRegistro) return;
  elementos.numeroRegistro.textContent = formatarNumeroRegistro(obterProximoNumeroRegistro());
}

function validarFormulario() {
  const camposObrigatorios = [
    { campo: elementos.data?.value.trim(), nome: "Data" },
    { campo: elementos.equipamento?.value.trim(), nome: "Equipamento" },
    { campo: elementos.problema?.value.trim(), nome: "Problema" }
  ];

  const campoVazio = camposObrigatorios.find((item) => !item.campo);

  if (campoVazio) {
    alert(`Preencha o campo obrigatório: ${campoVazio.nome}.`);
    return false;
  }

  return true;
}

function obterRegistroDoFormulario() {
  return {
    Registro: obterProximoNumeroRegistro(),
    Data: formatarDataParaBrasil(elementos.data?.value || ""),
    Turno: elementos.turno?.value || "A",
    Periodo: elementos.periodo?.value || "07x13",
    Colaborador: elementos.colaborador?.value.trim() || "",
    Equipamento: elementos.equipamento?.value.trim() || "",
    Local: elementos.local?.value.trim() || "",
    Problema: elementos.problema?.value.trim() || "",
    Causa: elementos.causa?.value.trim() || "",
    Solucao: elementos.solucao?.value.trim() || "",
    EDT: elementos.edt?.value || DEFAULT_EDT,
    TempoEDT: elementos.tempoEdt?.value || "0",
    Status: elementos.status?.value || DEFAULT_STATUS,
    Fotos: [...fotosTemporarias],
    DataHoraCadastro: new Date().toISOString()
  };
}

function salvarRegistro() {
  if (!validarFormulario()) return;

  try {
    const novoRegistro = obterRegistroDoFormulario();
    registros.push(novoRegistro);
    persistirRegistros();

    renderizarDashboard();
    renderizarTabela();
    limparFormulario();

    console.log("Registro salvo:", novoRegistro);
    alert("Registro salvo com sucesso.");
  } catch (error) {
    console.error("Erro ao salvar registro:", error);
    alert("Ocorreu um erro ao salvar o registro.");
  }
}

function limparFormulario() {
  const form = document.querySelector("#formRegistro");
  if (form) form.reset();

  if (elementos.turno) elementos.turno.value = "A";
  if (elementos.periodo) elementos.periodo.value = "07x13";
  if (elementos.edt) elementos.edt.value = DEFAULT_EDT;
  if (elementos.status) elementos.status.value = DEFAULT_STATUS;
  if (elementos.tempoEdt) elementos.tempoEdt.value = "";
  if (elementos.fotoInput) elementos.fotoInput.value = "";

  fotosTemporarias = [];
  renderizarPreviewDeFotos();

  popularDataAtual();
  atualizarNumeroRegistro();
}

function tratarSelecaoDeFotos(event) {
  const arquivos = Array.from(event.target.files || []);

  if (!arquivos.length) {
    fotosTemporarias = [];
    renderizarPreviewDeFotos();
    return;
  }

  const promessas = arquivos.map((file) => converterArquivoParaDataUrl(file));

  Promise.all(promessas)
    .then((imagens) => {
      fotosTemporarias = [...fotosTemporarias, ...imagens];
      renderizarPreviewDeFotos();
    })
    .catch((erro) => {
      console.error("Erro ao carregar imagens:", erro);
      alert("Não foi possível carregar uma ou mais imagens.");
    });
}

function converterArquivoParaDataUrl(file) {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();

    leitor.onload = (evento) => resolve(evento.target.result);
    leitor.onerror = () => reject(new Error("Falha ao ler arquivo"));
    leitor.readAsDataURL(file);
  });
}

function renderizarPreviewDeFotos() {
  if (!elementos.fotoPreviewContainer) return;

  elementos.fotoPreviewContainer.innerHTML = "";

  if (!fotosTemporarias.length) return;

  fotosTemporarias.forEach((foto, indice) => {
    const wrapper = document.createElement("div");
    wrapper.className = "preview-item";

    const img = document.createElement("img");
    img.src = foto;
    img.alt = "Foto da ocorrência";
    img.loading = "lazy";
    img.addEventListener("click", () => {
      abrirGaleriaDeTemporarias(indice);
    });

    const btnRemover = document.createElement("button");
    btnRemover.type = "button";
    btnRemover.className = "preview-remove";
    btnRemover.textContent = "×";
    btnRemover.setAttribute("aria-label", "Remover foto");
    btnRemover.addEventListener("click", (evento) => {
      evento.stopPropagation();
      fotosTemporarias.splice(indice, 1);
      renderizarPreviewDeFotos();
    });

    wrapper.appendChild(img);
    wrapper.appendChild(btnRemover);
    elementos.fotoPreviewContainer.appendChild(wrapper);
  });
}

function abrirGaleriaDeTemporarias(indiceInicial) {
  galeriaAtual = [...fotosTemporarias];
  indiceFotoAtual = indiceInicial;

  atualizarLightbox();
  if (elementos.lightbox) elementos.lightbox.classList.remove("hidden");
}

function atualizarLightbox() {
  if (!galeriaAtual.length) {
    fecharLightbox();
    return;
  }

  const foto = galeriaAtual[indiceFotoAtual];
  if (elementos.lightboxImage) {
    elementos.lightboxImage.src = foto;
    elementos.lightboxImage.alt = `Foto ${indiceFotoAtual + 1} de ${galeriaAtual.length}`;
  }
}

function fecharLightbox() {
  if (elementos.lightbox) elementos.lightbox.classList.add("hidden");
  if (elementos.lightboxImage) elementos.lightboxImage.src = "";

  galeriaAtual = [];
  indiceFotoAtual = 0;
}

function irParaFotoAnterior() {
  if (!galeriaAtual.length) return;

  indiceFotoAtual = (indiceFotoAtual - 1 + galeriaAtual.length) % galeriaAtual.length;
  atualizarLightbox();
}

function irParaFotoProxima() {
  if (!galeriaAtual.length) return;

  indiceFotoAtual = (indiceFotoAtual + 1) % galeriaAtual.length;
  atualizarLightbox();
}

function abrirGaleria(registroNumero, indiceInicial) {
  const registro = registros.find((item) => Number(item.Registro) === Number(registroNumero));

  if (!registro || !Array.isArray(registro.Fotos) || !registro.Fotos.length) return;

  galeriaAtual = [...registro.Fotos];
  indiceFotoAtual = Number(indiceInicial) || 0;

  atualizarLightbox();
  if (elementos.lightbox) elementos.lightbox.classList.remove("hidden");
}

function renderizarDashboard() {
  const concluidos = registros.filter((item) => item.Status === "Concluído").length;
  const pendentes = registros.filter((item) => item.Status === "Pendente").length;
  const comEdt = registros.filter((item) => item.EDT === "SIM").length;
  const tempoTotal = registros.reduce((total, item) => {
    const numero = Number(item.TempoEDT || 0);
    return total + (Number.isNaN(numero) ? 0 : numero);
  }, 0);

  if (elementos.totalRegistros) elementos.totalRegistros.textContent = String(registros.length);
  if (elementos.totalConcluidos) elementos.totalConcluidos.textContent = String(concluidos);
  if (elementos.totalPendentes) elementos.totalPendentes.textContent = String(pendentes);
  if (elementos.totalEdt) elementos.totalEdt.textContent = String(comEdt);
  if (elementos.tempoTotalEdt) elementos.tempoTotalEdt.textContent = `${tempoTotal} min`;
}

function obterRegistrosFiltrados() {
  const dataInicial = elementos.filtroDataInicial?.value || "";
  const dataFinal = elementos.filtroDataFinal?.value || "";
  const turno = elementos.filtroTurno?.value || "";
  const equipamento = (elementos.filtroEquipamento?.value || "").trim().toLowerCase();
  const status = elementos.filtroStatus?.value || "";
  const busca = (elementos.filtroBusca?.value || "").trim().toLowerCase();

  return registros.filter((registro) => {
    const dataRegistro = parseDateBR(registro.Data);

    if (dataInicial) {
      const inicio = parseDateISO(dataInicial);
      if (dataRegistro && inicio && dataRegistro < inicio) return false;
    }

    if (dataFinal) {
      const final = parseDateISO(dataFinal);
      if (dataRegistro && final && dataRegistro > final) return false;
    }

    if (turno && registro.Turno !== turno) return false;

    if (equipamento && !String(registro.Equipamento || "").toLowerCase().includes(equipamento)) return false;

    if (status && registro.Status !== status) return false;

    if (busca) {
      const textoBusca = [
        registro.Data,
        registro.Turno,
        registro.Periodo,
        registro.Colaborador,
        registro.Equipamento,
        registro.Local,
        registro.Problema,
        registro.Causa,
        registro.Solucao,
        registro.Status
      ].join(" ").toLowerCase();

      if (!textoBusca.includes(busca)) return false;
    }

    return true;
  });
}

function renderizarTabela() {
  if (!elementos.tabelaHist) return;

  const registrosFiltrados = [...obterRegistrosFiltrados()].sort(
    (a, b) => Number(a.Registro || 0) - Number(b.Registro || 0)
  );

  if (!registrosFiltrados.length) {
    elementos.tabelaHist.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">Nenhum registro encontrado.</td>
      </tr>
    `;
    return;
  }

  elementos.tabelaHist.innerHTML = registrosFiltrados
    .map((registro) => {
      const fotos = Array.isArray(registro.Fotos) ? registro.Fotos : [];
      const statusClass = registro.Status === "Concluído" ? "status-concluido" : "status-pendente";

      const miniaturas = fotos.length
        ? fotos
            .slice(0, 3)
            .map((foto, index) => `
              <img
                src="${foto}"
                alt="Foto do registro"
                class="foto-mini"
                data-registro="${registro.Registro}"
                data-indice="${index}"
              />
            `)
            .join("")
        : '<span class="foto-vazia">Sem foto</span>';

      const excesso = fotos.length > 3 ? `<span class="photo-count">+${fotos.length - 3}</span>` : "";

      return `
        <tr>
          <td><span class="registro-chip">${formatarNumeroRegistro(registro.Registro)}</span></td>
          <td>${registro.Data || "-"}</td>
          <td>${registro.Turno || "-"}</td>
          <td>${registro.Equipamento || "-"}</td>
          <td><span class="status-badge ${statusClass}">${registro.Status || "-"}</span></td>
          <td>${registro.EDT === "SIM" ? `${registro.TempoEDT || "0"} min` : "Não"}</td>
          <td>
            <div class="table-images">
              ${miniaturas}
              ${excesso}
            </div>
          </td>
        </tr>
      `;
    })
    .join("");
}

function exportarExcel() {
  if (!registros.length) {
    alert("Não existem registros para exportar.");
    return;
  }

  const dadosExportacao = registros.map((registro) => ({
    Registro: formatarNumeroRegistro(registro.Registro),
    Data: registro.Data,
    Turno: registro.Turno,
    Periodo: registro.Periodo,
    Colaborador: registro.Colaborador,
    Equipamento: registro.Equipamento,
    Local: registro.Local,
    Problema: registro.Problema,
    Causa: registro.Causa,
    Solucao: registro.Solucao,
    EDT: registro.EDT,
    "Tempo EDT": registro.TempoEDT || 0,
    Status: registro.Status
  }));

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(dadosExportacao);
  XLSX.utils.book_append_sheet(workbook, worksheet, "Notas");
  XLSX.writeFile(workbook, "Notas_Manutencao_TEG.xlsx");
}

function exportarPDF() {
  if (!registros.length) {
    alert("Nenhum registro para exportar.");
    return;
  }

  const ultimoRegistro = registros[registros.length - 1];
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  const margem = 40;
  const larguraPagina = doc.internal.pageSize.getWidth();
  const alturaPagina = doc.internal.pageSize.getHeight();
  let y = 40;

  doc.setFillColor(0, 93, 170);
  doc.roundedRect(margem, y, 140, 34, 8, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text("TEG", margem + 18, y + 22);

  doc.setFontSize(11);
  doc.text("SISTEMA DE NOTAS DE MANUTENÇÃO", margem + 170, y + 17);
  doc.text("Terminal Exportador do Guarujá", margem + 170, y + 31);

  y = 110;
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(10);
  doc.text(`Data/Hora impressão: ${new Date().toLocaleString("pt-BR")}`, margem, y);

  y += 24;
  doc.setFillColor(244, 246, 248);
  doc.roundedRect(margem, y, larguraPagina - margem * 2, 52, 8, 8, "F");
  doc.setTextColor(0, 75, 135);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(`Registro ${formatarNumeroRegistro(ultimoRegistro.Registro)}`, margem + 16, y + 22);

  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(`Data: ${ultimoRegistro.Data || "-"}`, margem + 240, y + 18);
  doc.text(`Turno: ${ultimoRegistro.Turno || "-"}`, margem + 240, y + 32);
  doc.text(`Status: ${ultimoRegistro.Status || "-"}`, margem + 360, y + 18);
  doc.text(`EDT: ${ultimoRegistro.EDT || "-"}`, margem + 360, y + 32);

  y = 190;
  const camposEmLinha = [
    { label: "Período", value: ultimoRegistro.Periodo || "-" },
    { label: "Colaborador", value: ultimoRegistro.Colaborador || "-" },
    { label: "Equipamento", value: ultimoRegistro.Equipamento || "-" },
    { label: "Local", value: ultimoRegistro.Local || "-" }
  ];

  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 93, 170);
  camposEmLinha.forEach((item, index) => {
    const x = margem + (index % 2) * 250;
    const yAtual = y + Math.floor(index / 2) * 28;

    doc.text(`${item.label}:`, x, yAtual);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    doc.text(String(item.value), x + 70, yAtual);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 93, 170);
  });

  y = 270;
  doc.setTextColor(0, 93, 170);
  doc.setFont("helvetica", "bold");
  doc.text("Problema", margem, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  const problema = doc.splitTextToSize(ultimoRegistro.Problema || "Não informado", larguraPagina - margem * 2 - 180);
  doc.text(problema, margem, y + 18);

  y += problema.length * 14 + 28;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 93, 170);
  doc.text("Causa", margem, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  const causa = doc.splitTextToSize(ultimoRegistro.Causa || "Não informado", larguraPagina - margem * 2 - 180);
  doc.text(causa, margem, y + 18);

  y += causa.length * 14 + 28;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 93, 170);
  doc.text("Solução", margem, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  const solucao = doc.splitTextToSize(ultimoRegistro.Solucao || "Não informado", larguraPagina - margem * 2 - 180);
  doc.text(solucao, margem, y + 18);

  if (ultimoRegistro.Fotos && ultimoRegistro.Fotos.length) {
    const fotoPrincipal = ultimoRegistro.Fotos[0];
    try {
      const tipoImagem = fotoPrincipal.includes("image/png") ? "PNG" : "JPEG";
      const xImagem = larguraPagina - 170;
      const yImagem = 150;
      doc.addImage(fotoPrincipal, tipoImagem, xImagem, yImagem, 130, 100);
    } catch (error) {
      console.warn("Não foi possível incluir a imagem no PDF:", error);
    }
  }

  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 93, 170);
  doc.text("Tempo EDT", margem, alturaPagina - 80);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  doc.text(`${ultimoRegistro.TempoEDT || 0} min`, margem + 90, alturaPagina - 80);

  doc.save(`Nota_${formatarNumeroRegistro(ultimoRegistro.Registro)}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

function parseDateBR(data) {
  if (!data || typeof data !== "string") return null;

  if (data.includes("/")) {
    const [dia, mes, ano] = data.split("/");
    if (!dia || !mes || !ano) return null;
    return new Date(Number(ano), Number(mes) - 1, Number(dia));
  }

  if (data.includes("-")) {
    const [ano, mes, dia] = data.split("-");
    if (!ano || !mes || !dia) return null;
    return new Date(Number(ano), Number(mes) - 1, Number(dia));
  }

  const parsed = new Date(data + "T00:00:00");
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseDateISO(value) {
  if (!value) return null;

  const parsed = new Date(value + "T00:00:00");
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
