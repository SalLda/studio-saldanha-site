/* Gestaopsi: exporta o financeiro do mês em .xlsx estilizado (resumo com gráficos rosca, lançamentos, despesas e metas).
   Gera o arquivo direto no navegador com JSZip, sem enviar nenhum dado para fora. */
(function (root) {
  'use strict';
  const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '');
  const colL = n => { let s = ''; n++; while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; };
  const serial = iso => { if (!iso) return null; const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number); if (!y) return null; return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(1899, 11, 30)) / 86400000); };

  // estilos (índices em cellXfs)
  const ST = { def: 0, title: 1, sub: 2, head: 3, txt: 4, cur: 5, date: 6, pct: 7, kLbl: 8, kVal: 9, totCur: 10, totLbl: 11, sect: 12, curG: 13, curR: 14, txtB: 15, headR: 16 };
  const GREEN = '2E6A55', INK = '1B1C1A', MUTED = '5F6B66', LIGHT = 'E6F2EC', LINE = 'D9E0DD';
  const PAL = ['2E6A55', '3D6373', '8A5100', 'BA1A1A', '7D5260', '4C662B', '6F8796', 'C98A1B', '1F7A4D', 'A04668', '5B6BB0', '8C8C3A'];

  function stylesXml() {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="2"><numFmt numFmtId="164" formatCode="&quot;R$&quot;\\ #,##0.00;[Red]\\-&quot;R$&quot;\\ #,##0.00"/><numFmt numFmtId="165" formatCode="dd/mm/yyyy"/></numFmts>
<fonts count="9">
<font><sz val="11"/><color rgb="FF${INK}"/><name val="Calibri"/><family val="2"/></font>
<font><b/><sz val="20"/><color rgb="FFFFFFFF"/><name val="Calibri"/><family val="2"/></font>
<font><sz val="11"/><color rgb="FFE6F2EC"/><name val="Calibri"/><family val="2"/></font>
<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/><family val="2"/></font>
<font><sz val="9"/><color rgb="FF${MUTED}"/><name val="Calibri"/><family val="2"/></font>
<font><b/><sz val="16"/><color rgb="FF${GREEN}"/><name val="Calibri"/><family val="2"/></font>
<font><b/><sz val="11"/><color rgb="FF${INK}"/><name val="Calibri"/><family val="2"/></font>
<font><b/><sz val="13"/><color rgb="FF${GREEN}"/><name val="Calibri"/><family val="2"/></font>
<font><b/><sz val="11"/><color rgb="FFBA1A1A"/><name val="Calibri"/><family val="2"/></font>
</fonts>
<fills count="4">
<fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FF${GREEN}"/><bgColor indexed="64"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FF${LIGHT}"/><bgColor indexed="64"/></patternFill></fill>
</fills>
<borders count="3">
<border><left/><right/><top/><bottom/><diagonal/></border>
<border><left/><right/><top/><bottom style="thin"><color rgb="FF${LINE}"/></bottom><diagonal/></border>
<border><left/><right/><top style="medium"><color rgb="FF${GREEN}"/></top><bottom/><diagonal/></border>
</borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="17">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center" indent="1"/></xf>
<xf numFmtId="0" fontId="2" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center" indent="1"/></xf>
<xf numFmtId="0" fontId="3" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
<xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center" indent="1"/></xf>
<xf numFmtId="165" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>
<xf numFmtId="9" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center" indent="1"/></xf>
<xf numFmtId="0" fontId="4" fillId="3" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center" indent="1"/></xf>
<xf numFmtId="164" fontId="5" fillId="3" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center" indent="1"/></xf>
<xf numFmtId="164" fontId="6" fillId="0" borderId="2" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center" indent="1"/></xf>
<xf numFmtId="0" fontId="6" fillId="0" borderId="2" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>
<xf numFmtId="0" fontId="7" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment vertical="center"/></xf>
<xf numFmtId="164" fontId="6" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center" indent="1"/></xf>
<xf numFmtId="164" fontId="8" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center" indent="1"/></xf>
<xf numFmtId="0" fontId="6" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="3" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="right" vertical="center" wrapText="1" indent="1"/></xf>
</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
<dxfs count="1"><dxf><font><b/><color rgb="FFBA1A1A"/></font><fill><patternFill><bgColor rgb="FFFDE7E4"/></patternFill></fill></dxf></dxfs>
</styleSheet>`;
  }

  // monta uma planilha a partir de linhas { r, ht, cells:[{c, v, s, f, t}] }
  class Sheet {
    constructor() { this.rows = new Map(); this.merges = []; this.cols = []; this.cf = []; this.filter = null; this.freeze = null; this.grid = true; this.drawing = false; this.tab = null; }
    row(r, ht) { if (!this.rows.has(r)) this.rows.set(r, { ht: null, cells: new Map() }); const x = this.rows.get(r); if (ht) x.ht = ht; return x; }
    set(r, c, v, s, opt = {}) { this.row(r).cells.set(c, { v, s: s ?? 0, f: opt.f }); }
    xml() {
      const rows = [...this.rows.keys()].sort((a, b) => a - b);
      let maxC = 0; rows.forEach(r => this.rows.get(r).cells.forEach((_, c) => { if (c > maxC) maxC = c; }));
      const body = rows.map(r => { const R = this.rows.get(r); const cs = [...R.cells.keys()].sort((a, b) => a - b).map(c => {
        const x = R.cells.get(c), ref = colL(c) + (r + 1), s = ` s="${x.s}"`;
        if (x.f != null) return `<c r="${ref}"${s}><f>${esc(x.f)}</f>${typeof x.v === 'number' ? `<v>${x.v}</v>` : ''}</c>`;
        if (x.v === null || x.v === undefined || x.v === '') return `<c r="${ref}"${s}/>`;
        if (typeof x.v === 'number') return `<c r="${ref}"${s}><v>${x.v}</v></c>`;
        return `<c r="${ref}"${s} t="inlineStr"><is><t xml:space="preserve">${esc(x.v)}</t></is></c>`; }).join('');
        return `<row r="${r + 1}"${R.ht ? ` ht="${R.ht}" customHeight="1"` : ''}>${cs}</row>`; }).join('');
      const view = `<sheetViews><sheetView workbookViewId="0"${this.grid ? '' : ' showGridLines="0"'}${this.first ? ' tabSelected="1"' : ''}>${this.freeze ? `<pane ySplit="${this.freeze}" topLeftCell="A${this.freeze + 1}" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft"/>` : ''}</sheetView></sheetViews>`;
      const cols = this.cols.length ? `<cols>${this.cols.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('')}</cols>` : '';
      const merges = this.merges.length ? `<mergeCells count="${this.merges.length}">${this.merges.map(m => `<mergeCell ref="${m}"/>`).join('')}</mergeCells>` : '';
      const cf = this.cf.map((x, i) => `<conditionalFormatting sqref="${x.ref}"><cfRule type="expression" dxfId="0" priority="${i + 1}"><formula>${esc(x.f)}</formula></cfRule></conditionalFormatting>`).join('');
      return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheetPr>${this.tab ? `<tabColor rgb="FF${this.tab}"/>` : ''}<pageSetUpPr fitToPage="1"/></sheetPr>${view}<sheetFormatPr defaultRowHeight="20"/>${cols}<sheetData>${body}</sheetData>${this.filter ? `<autoFilter ref="${this.filter}"/>` : ''}${merges}${cf}<pageMargins left="0.5" right="0.5" top="0.6" bottom="0.6" header="0.3" footer="0.3"/><pageSetup paperSize="9" orientation="landscape" fitToHeight="0"/>${this.drawing ? '<drawing r:id="rId1"/>' : ''}</worksheet>`;
    }
  }

  function chartXml(title, catRef, valRef, cats, vals, colors) {
    const pts = cats.map((_, i) => `<c:dPt><c:idx val="${i}"/><c:bubble3D val="0"/><c:spPr><a:solidFill><a:srgbClr val="${colors[i % colors.length]}"/></a:solidFill><a:ln w="19050"><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill></a:ln></c:spPr></c:dPt>`).join('');
    const sc = cats.map((c, i) => `<c:pt idx="${i}"><c:v>${esc(c)}</c:v></c:pt>`).join('');
    const nc = vals.map((v, i) => `<c:pt idx="${i}"><c:v>${v}</c:v></c:pt>`).join('');
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><c:roundedCorners val="0"/>
<c:chart><c:title><c:tx><c:rich><a:bodyPr/><a:lstStyle/><a:p><a:pPr><a:defRPr sz="1300" b="1"><a:solidFill><a:srgbClr val="${GREEN}"/></a:solidFill></a:defRPr></a:pPr><a:r><a:rPr lang="pt-BR" sz="1300" b="1"><a:solidFill><a:srgbClr val="${GREEN}"/></a:solidFill></a:rPr><a:t>${esc(title)}</a:t></a:r></a:p></c:rich></c:tx><c:overlay val="0"/></c:title><c:autoTitleDeleted val="0"/>
<c:plotArea><c:layout/><c:doughnutChart><c:varyColors val="1"/>
<c:ser><c:idx val="0"/><c:order val="0"/><c:tx><c:v>${esc(title)}</c:v></c:tx>${pts}
<c:dLbls><c:numFmt formatCode="0%" sourceLinked="0"/><c:spPr><a:noFill/><a:ln><a:noFill/></a:ln></c:spPr><c:txPr><a:bodyPr/><a:lstStyle/><a:p><a:pPr><a:defRPr sz="900" b="1"><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill></a:defRPr></a:pPr><a:endParaRPr lang="pt-BR"/></a:p></c:txPr><c:showLegendKey val="0"/><c:showVal val="0"/><c:showCatName val="0"/><c:showSerName val="0"/><c:showPercent val="1"/><c:showBubbleSize val="0"/><c:showLeaderLines val="0"/></c:dLbls>
<c:cat><c:strRef><c:f>${esc(catRef)}</c:f><c:strCache><c:ptCount val="${cats.length}"/>${sc}</c:strCache></c:strRef></c:cat>
<c:val><c:numRef><c:f>${esc(valRef)}</c:f><c:numCache><c:formatCode>General</c:formatCode><c:ptCount val="${vals.length}"/>${nc}</c:numCache></c:numRef></c:val></c:ser>
<c:firstSliceAng val="0"/><c:holeSize val="60"/></c:doughnutChart></c:plotArea>
<c:legend><c:legendPos val="r"/><c:overlay val="0"/></c:legend><c:plotVisOnly val="1"/><c:dispBlanksAs val="gap"/></c:chart>
<c:spPr><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill><a:ln w="9525"><a:solidFill><a:srgbClr val="${LINE}"/></a:solidFill></a:ln></c:spPr></c:chartSpace>`;
  }

  function anchor(id, rid, c0, r0, c1, r1, name) {
    return `<xdr:twoCellAnchor><xdr:from><xdr:col>${c0}</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${r0}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from><xdr:to><xdr:col>${c1}</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${r1}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:to><xdr:graphicFrame macro=""><xdr:nvGraphicFramePr><xdr:cNvPr id="${id}" name="${esc(name)}"/><xdr:cNvGraphicFramePr/></xdr:nvGraphicFramePr><xdr:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/></xdr:xfrm><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart"><c:chart xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:id="${rid}"/></a:graphicData></a:graphic></xdr:graphicFrame><xdr:clientData/></xdr:twoCellAnchor>`;
  }

  /* data = {
       clinica: 'Nome', mes: 'novembro de 2026', geradoEm: 'AAAA-MM-DD',
       kpis: { gerado, recebido, areceber, atraso, despesasPj, gastosPf },
       sessoes: [{ data, paciente, status, valor, vence, pagoEm, situacao }],
       despesas: [{ escopo:'pj'|'pf', categoria, tipo, descricao, valor, paga }],
       categorias: [{ escopo, categoria, gasto, meta }]  // linhas do gráfico/metas
     } */
  async function build(data, JSZip) {
    const k = data.kpis, L = data.categorias || [];
    const resultado = k.recebido - k.despesasPj, sobra = resultado - k.gastosPf;

    // ---------- Resumo ----------
    const S1 = new Sheet(); S1.first = true; S1.grid = false; S1.tab = GREEN; S1.cols = [42, 14, 17, 17, 14, 3, 14, 14, 14, 14, 14, 14, 14];
    S1.row(0, 40); S1.row(1, 22);
    for (let c = 0; c <= 12; c++) { S1.set(0, c, c ? '' : 'Gestaopsi · Financeiro', ST.title); S1.set(1, c, c ? '' : `${data.clinica || 'Consultório'} · ${data.mes}`, ST.sub); }
    S1.merges.push('A1:M1', 'A2:M2');
    S1.set(3, 0, 'Clínica no mês', ST.sect); S1.row(3, 24);
    const kp = [['Gerado', k.gerado], ['Recebido', k.recebido], ['A receber', k.areceber], ['Em atraso', k.atraso], ['Despesas do consultório', k.despesasPj]];
    kp.forEach(([l, v], i) => { const r = 4 + i; S1.set(r, 0, l, ST.txtB); S1.set(r, 1, v, ST.curG); });
    // cadeia do gráfico da clínica: recebido, a receber, em atraso, despesas (linhas 6..9 => índices 5..8)
    S1.set(9, 0, 'Resultado da clínica (recebido − despesas)', ST.totLbl); S1.set(9, 1, resultado, ST.totCur, { f: 'B6-B9' });
    S1.set(11, 0, 'Gastos do mês: consultório (PJ) e pessoais (PF)', ST.sect); S1.row(11, 24);
    ['Categoria', 'Tipo', 'Gasto', 'Meta do mês', '% da meta'].forEach((h, i) => S1.set(12, i, h, i >= 2 ? ST.headR : ST.head)); S1.row(12, 24);
    const rows = L.length ? L : [{ escopo: 'pj', categoria: 'Sem gastos lançados', gasto: 0, meta: 0 }];
    rows.forEach((x, i) => { const r = 13 + i, n = r + 1;
      S1.set(r, 0, x.categoria, ST.txt); S1.set(r, 1, x.escopo === 'pf' ? 'Pessoal' : 'Consultório', ST.txt); S1.set(r, 2, x.gasto, ST.cur);
      S1.set(r, 3, x.meta || 0, ST.cur); S1.set(r, 4, x.meta ? x.gasto / x.meta : 0, ST.pct, { f: `IF(D${n}>0,C${n}/D${n},0)` }); });
    const first = 14, last = 13 + rows.length, tr = last;
    S1.set(tr, 0, 'Total', ST.totLbl); S1.set(tr, 1, '', ST.totLbl); S1.set(tr, 2, rows.reduce((a, x) => a + x.gasto, 0), ST.totCur, { f: `SUM(C${first}:C${last})` });
    S1.set(tr, 3, rows.reduce((a, x) => a + (x.meta || 0), 0), ST.totCur, { f: `SUM(D${first}:D${last})` }); S1.set(tr, 4, '', ST.totLbl);
    S1.cf.push({ ref: `E${first}:E${last}`, f: `E${first}>1` });
    const br = tr + 2;
    S1.set(br, 0, 'Balanço do mês', ST.sect); S1.row(br, 24);
    const bal = [['Recebido', k.recebido, ST.curG], ['− Despesas do consultório', -k.despesasPj, ST.cur], ['= Resultado da clínica', resultado, ST.curG], ['− Gastos pessoais', -k.gastosPf, ST.cur]];
    bal.forEach(([l, v, s], i) => { S1.set(br + 1 + i, 0, l, ST.txt); S1.set(br + 1 + i, 1, v, s); });
    S1.set(br + 5, 0, '= Sobra do mês', ST.totLbl); S1.set(br + 5, 1, sobra, ST.totCur, { f: `B${br + 4}+B${br + 5}` });
    S1.set(br + 7, 0, 'Valores em reais. Despesas e gastos pessoais lançados no Gestaopsi; metas definidas em Financeiro > Metas.', ST.kLbl);
    S1.drawing = true;

    // ---------- Lançamentos ----------
    const S2 = new Sheet(); S2.tab = '3D6373'; S2.cols = [13, 30, 14, 17, 14, 14, 16]; S2.freeze = 3;
    S2.row(0, 32); for (let c = 0; c <= 6; c++) S2.set(0, c, c ? '' : 'Lançamentos de sessões', ST.title); S2.merges.push('A1:G1');
    S2.set(1, 0, `${data.mes} · ${data.sessoes.length} sessões`, ST.kLbl); for (let c = 1; c <= 6; c++) S2.set(1, c, '', ST.kLbl); S2.merges.push('A2:G2');
    ['Data', 'Paciente', 'Status', 'Valor', 'Vence', 'Pago em', 'Situação'].forEach((h, i) => S2.set(2, i, h, i === 3 ? ST.headR : ST.head)); S2.row(2, 24);
    data.sessoes.forEach((x, i) => { const r = 3 + i; S2.set(r, 0, serial(x.data), ST.date); S2.set(r, 1, x.paciente, ST.txt); S2.set(r, 2, x.status, ST.txt); S2.set(r, 3, x.valor, ST.cur); S2.set(r, 4, serial(x.vence), ST.date); S2.set(r, 5, serial(x.pagoEm), ST.date); S2.set(r, 6, x.situacao, ST.txt); });
    const s2last = 3 + data.sessoes.length;
    S2.set(s2last, 0, 'Total', ST.totLbl); for (let c = 1; c <= 6; c++) S2.set(s2last, c, '', ST.totLbl);
    S2.set(s2last, 3, data.sessoes.reduce((a, x) => a + x.valor, 0), ST.totCur, { f: `SUBTOTAL(109,D4:D${s2last})` });
    S2.filter = `A3:G${Math.max(s2last, 4)}`;

    // ---------- Despesas ----------
    const S3 = new Sheet(); S3.tab = '8A5100'; S3.cols = [14, 32, 16, 34, 17, 14]; S3.freeze = 3;
    S3.row(0, 32); for (let c = 0; c <= 5; c++) S3.set(0, c, c ? '' : 'Despesas e gastos pessoais', ST.title); S3.merges.push('A1:F1');
    S3.set(1, 0, `${data.mes} · ${data.despesas.length} lançamentos`, ST.kLbl); for (let c = 1; c <= 5; c++) S3.set(1, c, '', ST.kLbl); S3.merges.push('A2:F2');
    ['Origem', 'Categoria', 'Tipo', 'Descrição', 'Valor', 'Situação'].forEach((h, i) => S3.set(2, i, h, i === 4 ? ST.headR : ST.head)); S3.row(2, 24);
    data.despesas.forEach((x, i) => { const r = 3 + i; S3.set(r, 0, x.escopo === 'pf' ? 'Pessoal' : 'Consultório', ST.txt); S3.set(r, 1, x.categoria, ST.txt); S3.set(r, 2, x.tipo, ST.txt); S3.set(r, 3, x.descricao || '', ST.txt); S3.set(r, 4, x.valor, ST.cur); S3.set(r, 5, x.paga ? 'Paga' : 'A pagar', ST.txt); });
    const s3last = 3 + data.despesas.length;
    S3.set(s3last, 0, 'Total', ST.totLbl); for (let c = 1; c <= 5; c++) S3.set(s3last, c, '', ST.totLbl);
    S3.set(s3last, 4, data.despesas.reduce((a, x) => a + x.valor, 0), ST.totCur, { f: `SUBTOTAL(109,E4:E${s3last})` });
    S3.filter = `A3:F${Math.max(s3last, 4)}`;

    // ---------- Metas ----------
    const S4 = new Sheet(); S4.tab = '7D5260'; S4.cols = [34, 14, 17, 17, 17, 12]; S4.freeze = 3;
    S4.row(0, 32); for (let c = 0; c <= 5; c++) S4.set(0, c, c ? '' : 'Metas por categoria', ST.title); S4.merges.push('A1:F1');
    S4.set(1, 0, `${data.mes} · gasto do mês contra a meta`, ST.kLbl); for (let c = 1; c <= 5; c++) S4.set(1, c, '', ST.kLbl); S4.merges.push('A2:F2');
    ['Categoria', 'Origem', 'Meta do mês', 'Gasto', 'Saldo', '% usado'].forEach((h, i) => S4.set(2, i, h, i >= 2 ? ST.headR : ST.head)); S4.row(2, 24);
    const metas = L.filter(x => x.meta > 0 || x.gasto > 0);
    metas.forEach((x, i) => { const r = 3 + i, n = r + 1; S4.set(r, 0, x.categoria, ST.txt); S4.set(r, 1, x.escopo === 'pf' ? 'Pessoal' : 'Consultório', ST.txt); S4.set(r, 2, x.meta || 0, ST.cur); S4.set(r, 3, x.gasto, ST.cur);
      S4.set(r, 4, (x.meta || 0) - x.gasto, ST.cur, { f: `C${n}-D${n}` }); S4.set(r, 5, x.meta ? x.gasto / x.meta : 0, ST.pct, { f: `IF(C${n}>0,D${n}/C${n},0)` }); });
    const s4last = 3 + metas.length;
    S4.set(s4last, 0, 'Total', ST.totLbl); S4.set(s4last, 1, '', ST.totLbl);
    S4.set(s4last, 2, metas.reduce((a, x) => a + (x.meta || 0), 0), ST.totCur, { f: `SUM(C4:C${s4last})` }); S4.set(s4last, 3, metas.reduce((a, x) => a + x.gasto, 0), ST.totCur, { f: `SUM(D4:D${s4last})` });
    S4.set(s4last, 4, metas.reduce((a, x) => a + (x.meta || 0) - x.gasto, 0), ST.totCur, { f: `C${s4last + 1}-D${s4last + 1}` }); S4.set(s4last, 5, '', ST.totLbl);
    if (metas.length) S4.cf.push({ ref: `F4:F${s4last}`, f: 'F4>1' });

    // ---------- gráficos ----------
    const cats1 = ['Recebido', 'A receber', 'Em atraso', 'Despesas'], vals1 = [k.recebido, k.areceber, k.atraso, k.despesasPj];
    const c1 = chartXml(`Clínica no mês · gerado ${brl(k.gerado)}`, 'Resumo!$A$6:$A$9', 'Resumo!$B$6:$B$9', ['Recebido', 'A receber', 'Em atraso', 'Despesas do consultório'], vals1, ['3D6373', '8A5100', 'BA1A1A', '7D5260']);
    const c2 = chartXml('Gastos do mês por categoria', `Resumo!$A$${first}:$A$${last}`, `Resumo!$C$${first}:$C$${last}`, rows.map(x => x.categoria), rows.map(x => x.gasto), PAL);
    const drawing = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">${anchor(2, 'rId1', 6, 3, 13, 19, 'Clínica')}${anchor(3, 'rId2', 6, 20, 13, 38, 'Gastos')}</xdr:wsDr>`;

    // ---------- pacote ----------
    const names = ['Resumo', 'Lançamentos', 'Despesas', 'Metas'], sheets = [S1, S2, S3, S4];
    const zip = new JSZip();
    zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/><Override PartName="/xl/charts/chart1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/><Override PartName="/xl/charts/chart2.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>`);
    zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>`);
    zip.file('docProps/core.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>Gestaopsi · Financeiro ${esc(data.mes)}</dc:title><dc:creator>Gestaopsi</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${(data.geradoEm || '2026-01-01')}T12:00:00Z</dcterms:created></cp:coreProperties>`);
    zip.file('docProps/app.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Gestaopsi</Application></Properties>`);
    zip.file('xl/workbook.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView xWindow="0" yWindow="0" windowWidth="24000" windowHeight="14000"/></bookViews><sheets>${names.map((n, i) => `<sheet name="${esc(n)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets><calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>`);
    zip.file('xl/_rels/workbook.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`);
    zip.file('xl/styles.xml', stylesXml());
    sheets.forEach((s, i) => zip.file(`xl/worksheets/sheet${i + 1}.xml`, s.xml()));
    zip.file('xl/worksheets/_rels/sheet1.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing1.xml"/></Relationships>`);
    zip.file('xl/drawings/drawing1.xml', drawing);
    zip.file('xl/drawings/_rels/drawing1.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart" Target="../charts/chart1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart" Target="../charts/chart2.xml"/></Relationships>`);
    zip.file('xl/charts/chart1.xml', c1); zip.file('xl/charts/chart2.xml', c2);
    return zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
  }
  const brl = n => 'R$ ' + Number(n || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  root.FinXlsx = { build };
  if (typeof module !== 'undefined') module.exports = { build };
})(typeof window !== 'undefined' ? window : globalThis);
