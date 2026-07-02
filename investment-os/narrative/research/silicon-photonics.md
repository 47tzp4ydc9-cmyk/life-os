---
type: research
created: 2026-07-02
updated: 2026-07-02
topic_type: industry
slug: silicon-photonics
related_symbols: [CRDO, FN, LITE, COHR, MRVL, AAOI, SIVE, POET, ALMU, QUBT, NVDA, AVGO]
related_themes: [photonics, ai-datacenter, optical-interconnect, co-packaged-optics]
current_verdict: wait
related_catalysts: []
---

## Summary

**The core thesis**: Photonics/optical-interconnect solves the "copper wall" bottleneck in AI infrastructure. At 224 Gbps/lane, copper reach drops below 1m and interconnects consume ~30% of datacenter power. The sector is not one monolithic market but **four layered products at different maturity stages**, each with distinct customers and timelines:

| Layer | Technology | Customers | Status | Revenue stage | Timeline | Key players |
|---|---|---|---|---|---|---|
| 1 | **Pluggable transceivers** (800G→1.6T→3.2T) | Hyperscalers, all cloud providers | Mature, high-volume | **Cash-generative today** | 2026+ mainstream | AAOI, Coherent, Lumentum, Fabrinet, TeraHop (China), Innolight |
| 2 | **Smart copper (AEC/ACC)** — Active Electrical Cables | Same as #1 + shorter-reach apps | Mature, growing — copper's last stand | Competing for the same $$ as pluggables | 2026+ (extended life, margin squeeze) | **Credo** (core business), Semtech, Marvell, TE Connectivity |
| 3 | **Co-packaged optics (CPO)** | Switch OEMs (NVIDIA, Broadcom), hyperscalers | Early commercial, supply chain immature | Pilot deployments only; revenue ramps 2028+ | **2028-2030 large-scale** (not 2026-27) | NVIDIA, Broadcom, TSMC (COUPE), Coherent, Lumentum, GF, Tower |
| 4 | **In-package optical I/O** | GPU/XPU designers | Frontier, prototype-stage | No revenue yet | **2027+** real silicon tapeouts | Ayar Labs, Lightmatter, Celestial AI (→Marvell), Intel |

**The anchor customer**: NVIDIA. NVIDIA has deployed >$6.5B into photonics suppliers in 2026 YTD alone, including $2B each into Coherent and Lumentum with multiyear purchase commitments. NVIDIA's roadmap (Spectrum-X Ethernet Photonics H2 2026, Quantum-X InfiniBand early 2026) essentially *defines* the industry standard.

**Current sector state (as of 2026-07-02)**: Mid-shakeout post-massive run. Sector rallied hard into mid-2026 (AAOI +233-328% YTD peak, LITE +98-156%, COHR +80-87%) but is experiencing overlapping selloffs: (1) June 9 — SemiAnalysis report flagged CPO packaging yield risk (0.95^32 ≈ 19.4% system yield for 32-engine switch ASIC), triggering AAOI -17%, COHR -11%, LITE -8%; (2) July 2 — broader AI-hardware pullback (NVDA -2%, INTC -6%) with AAOI -17%, COHR -10%, LITE -10% again. NVIDIA's CTO (Gilad Shainer) publicly disputed the yield thesis on June 9, stating CPO is already shipping and ramping H2 2026 — but the fundamental truth is that **large-scale CPO deployment is realistically 2028-2030 (Yole Group forecast), not 2026-2027**, which current stock narratives don't seem fully priced in.

**Real bottlenecks being solved** (distinct from hype):
1. **CPO packaging yield at scale** — currently unresolved; the June 9 SemiAnalysis report identified the technical risk (0.95^32 scenario) but lack of independent refutation by actual manufacturers is telling.
2. **Power per bit** — Intel's OCI chiplet claims 5 pJ/bit vs. 15 pJ/bit on legacy systems; this is a real physics win, though not universally achieved yet.
3. **Indium/Indium Phosphide supply** — China supply concentration is the sector's single most concrete, physically-verifiable chokepoint. No fast substitute exists.
4. **External Light Sources for CPO** — an emerging, well-defined ~$1B+/yr sub-market (POET/Sivers territory) that didn't exist as a category two years ago.

**Competitive landscape** (beyond "photonics vs. nothing"):

| Threat | Type | Reality | Verdict |
|---|---|---|---|
| Wireless/free-space optics (Taara, mmWave/6G) | Complementary | Deployed in access networks and hard-to-reach terrain, *not* inside datacenters; atmospheric limits prevent datacenter-scale bandwidth | **Not a threat to core thesis** |
| Copper innovation (PAM4, AEC, 224G SerDes) | Direct competitor | Actively fighting back — NVIDIA achieving 224G+224G bidirectional SerDes on Rubin; Active Electrical Cables extend reach to ~7m; Semtech's DirectEdge keeping copper competitive through 3.2T | **Real threat**: Industry view is hybrid co-packaged copper + CPO will coexist, not optics fully displace |
| China (TeraHop/Innolight, Hisense, Accezlink) | Margin squeeze | Shipping millions of modules, closing tech gap via government programs and academic collaboration | **Margin risk** in commoditizing pluggable-transceiver layer; less threat in cutting-edge CPO/optical I/O where Western IP leads |

## Terminology Glossary

**Speed/bandwidth**
- **800G / 1.6T / 3.2T** — total data rate of one transceiver/link (gigabits or terabits/sec). Each generation roughly doubles the last. 800G is mainstream today; 1.6T is the 2026 ramp; 3.2T is next.
- **Per-lane speed (112G, 200G, 224G, 448G)** — speed of one lane within a multi-lane link; total = lanes × per-lane speed. "224G SerDes" = the hardest current engineering target.
- **Baud rate** — symbol changes per second (not the same as bits/sec — see PAM4).
- **PAM4** — encodes 2 bits per symbol (4 signal levels) instead of 1 bit/symbol (older NRZ/PAM2); how the industry doubled bandwidth without doubling raw frequency. PAM6/PAM8 (more levels/symbol) are the next lever being discussed, at the cost of more noise sensitivity.

**Cable/connection family**
- **DAC (Direct Attach Copper)** — dumb copper, no chips, <~1m reach, cheapest.
- **ACC (Active Copper Cable)** — copper with simple analog amplifiers, ~2-2.5m reach, low power.
- **AEC (Active Electrical Cable)** — copper with a real DSP chip embedded in each end; reaches ~7m at high speed. This is Credo's core business — the "smart copper" keeping copper competitive against optics.
- **Pluggable transceiver / optical module** — the traditional plug-in module (SFP/QSFP form factor) converting electrical↔optical. Mature, high-volume; where AAOI/Coherent/Lumentum earn most current revenue.
- **LPO (Linear-drive Pluggable Optics)** — cheaper/lower-power pluggable variant that skips the DSP chip (small signal-integrity tradeoff). AAOI's Microsoft relationship is built on this.
- **CPO (Co-Packaged Optics)** — optical engine soldered directly onto the same package as the switch ASIC instead of plugging in separately. Shorter electrical path = less power/latency. Early commercial, not at real scale yet.
- **Optical I/O / in-package optical I/O** — goes further than CPO: optical chiplet sits inside the *processor's* package, extending chip-to-chip links (e.g., NVLink) with light. Frontier layer (Ayar Labs, Lightmatter).

**Chip/hardware**
- **ASIC** — a chip custom-built for one job (vs. general-purpose CPU). NVIDIA's Spectrum-X switch chip, Google's TPU are ASICs.
- **DSP (Digital Signal Processor)** — cleans up/corrects a signal so it survives the trip with fewer errors; costs power, which is why the industry is trying to design it out (see LPO).
- **SerDes (Serializer/Deserializer)** — converts data between parallel (inside-chip) and serial (down-a-wire-or-fiber) form and back.
- **TIA (Transimpedance Amplifier)** — receiving-end chip converting a photodetector's tiny current into a usable voltage signal (Semtech, MACOM make these).
- **Modulator** — encodes electrical data onto a light beam.
- **EML (Electro-absorption Modulated Laser)** — laser+modulator combo used heavily in transceivers; the component NVIDIA has been pre-buying aggressively (supply crunch). Lumentum is currently the only volume supplier of 200G-per-lane EMLs.
- **Photodetector/photodiode** — receiving-end component converting incoming light back to electrical current.

**Materials/manufacturing**
- **Silicon photonics (SiPho)** — building optical components using standard silicon chip manufacturing, piggybacking on cheap high-volume fabs.
- **InP (Indium Phosphide)** — specialty material needed to generate laser light (silicon is bad at emitting light). The sector's core supply-chain chokepoint.
- **COUPE** — TSMC's manufacturing platform for CPO chips; NVIDIA's Quantum-X/Spectrum-X roadmap follows it.
- **OCS (Optical Circuit Switch)** — switches light itself (e.g., via tiny mirrors) rather than converting to electrical and back; used to dynamically reconfigure rack connectivity. Lumentum's other major growth line besides CPO.

**Distance/topology**
- **Scale-up** — connections within a tight compute cluster (GPU-to-GPU, in-rack); ultra-low latency (NVLink lives here).
- **Scale-out** — connections between racks/pods across a datacenter floor; higher-volume, longer-reach (Ethernet/InfiniBand switches).
- **DCI (Data Center Interconnect)** — links between entire datacenters, km to thousands of km apart; uses "coherent optics" (different, longer-reach optical technology than in-rack CPO).

## Supply Chain: Raw Materials, Equipment, and Manufacturing Steps

**Supply-chain flow (simplified):**
```
Raw materials (Indium, InP wafers, SOI) 
  → Crystal growth (MOCVD/MBE: Aixtron, Veeco) 
  → Lithography (ASML, Ushio interference) 
  → Assembly/Packaging (SUSS MicroTec, Fabrinet) 
  → Foundries (TSMC COUPE, GF Fotonix, Tower) 
  → Design/Simulation (Synopsys, Cadence) 
  → Testing (Keysight, FormFactor)
```

The single biggest chokepoint: **raw indium sourcing** (~60-70% of global production is Chinese zinc mining byproduct). All downstream activities become impossible if this supply tightens.

### Raw Materials Layer
| Material | Purpose | Key suppliers | Risk |
|---|---|---|---|
| Indium | Base element for InP | ~60-70% of global production is a byproduct of Chinese zinc mining | Single biggest structural risk in the sector — no fast substitute |
| InP substrates/wafers | Blank wafer laser chips start from | AXT Inc. dominant, but primary fab is in Beijing | China exposure even in the "Western" supplier |
| Photonics-grade SOI (silicon-on-insulator) wafers | Base wafer for silicon photonics chips (needs ultra-uniform buried oxide layer) | Soitec (France) leads at 300mm scale | Specialized input, not commodity silicon |
| GaAs, InGaAs | Alternative III-V materials for photodetectors/some lasers | Multiple suppliers; Aeluma's niche is growing these directly on silicon | Less concentrated than InP |
| Glass substrates | Emerging CPO packaging material (replacing plastic PCBs for high-heat applications) | Corning leading | Still 2027-28 mainstream, not current revenue |

### Supply-Chain Risk Concentration

| Chokepoint | Current risk level | Impact if constrained | Mitigation/Status |
|---|---|---|---|
| **Indium sourcing** | 🔴 CRITICAL | All laser production stops — no CPO, no pluggables | China export licensing tightened late 2025; NVIDIA pre-buying capacity; no fast substitute exists |
| **InP substrate wafers** | 🔴 HIGH | Laser wafer supply breaks | AXT dominates, but Beijing fab has China exposure; Coherent attempting 6" wafer expansion |
| **Photonics-grade SOI wafers** | 🟡 MEDIUM | Silicon photonics chip production slows | Soitec leads at 300mm; not commodity silicon; Yole forecasts 35% CAGR through 2030 |
| **EML (laser) components** | 🟡 MEDIUM | Pluggable and CPO modules limited | Lumentum is only 200G-per-lane volume supplier; NVIDIA pre-allocating capacity through 2027 |
| **CPO packaging yield** | 🟡 MEDIUM | CPO deployments delayed beyond 2028-2030 | SemiAnalysis flagged 19.4% system yield risk; NVIDIA disputes; unresolved |
| **Advanced packaging (SUSS bonding)** | 🟡 MEDIUM | 3D-stacking capability constrained | SUSS MicroTec + EV Group duopoly; supply chain qualified, not currently bottlenecked |
| **Foundry capacity** | 🟢 LOW (for now) | Modest delays on tapeouts | TSMC COUPE ramping, GF Fotonix scaling, Tower/UMC coming online; competition healthy |

### Equipment & Manufacturing Steps (2-7)

**2. Crystal growth / epitaxy** (atomic-layer precision; determines laser wavelength/speed/lifespan)
- MOCVD reactors: Aixtron (Germany) leading
- MBE reactors: Veeco leading
- In-house (Lumentum/Coherent/AAOI): proprietary recipes
- Outsourced: IQE plc (large outsourced-epitaxy supplier)

**3. Lithography / patterning**
- ASML: standard deep-UV/EUV (sometimes overkill for photonics)
- Interference lithography: Ushio (specialized, cheaper for diffraction gratings)
- Electron beam lithography (EBL): higher precision, slower

**4. Assembly / packaging** (the hardest, most photonics-specific step)
- Precision bonding: SUSS MicroTec (leading), EV Group (alternative) — for stacking photonic chips onto electronic chips; chips thinned to ~50-100 microns
- Optical alignment/coupling: Fabrinet (contract manufacturer), Coherent, Jenoptik (micro-lenses), Viavi — ~1 micron tolerance required
- Wafer-level optical probing: FormFactor notable — testing light propagation before permanent bonding
- Automated optical inspection: Onto Innovation, Cognex, Keyence

**5. Design & simulation software** (mandatory before fabrication)
- Synopsys (via Ansys/Lumerical photonic tools): dominant combined electronics+photonics platform
- Cadence: competing photonic design tools

**6. Foundries**
- **TSMC**: COUPE platform for CPO (adopted by NVIDIA, Broadcom); leading for CPO-era 3D-stacked chips
- **GlobalFoundries**: today's standard silicon photonics via "GF Fotonix"; offers "China-free" supply option via AMF acquisition
- **Tower Semiconductor**: specialty foundry, NVIDIA's dedicated silicon photonics partner (Feb 2026)
- **UMC**: newest entrant, licensed imec's iSiPP300 process, planning risk production

**7. Supporting/enabling equipment**
- Precision timing: SiTime (MEMS oscillators) for picosecond-level synchronization
- Thermal management: Indium Corporation (thermal solders), TE Connectivity, Amphenol
- Test & measurement: Keysight (standard-setter for final certification)

**Data source caveat**: Equipment/materials names were substantially sourced from a single enthusiast investor's Substack (Stock Crock), which discloses active personal positions in several names mentioned. The physical/structural layer-mapping (what equipment does what, roughly who plays where) is corroborated across other sources and treated as reasonably solid; specific claims about market-share percentages, "monopoly" framing, and valuation calls are that author's opinion and not independently verified — treat names like AXT, IQE, Ushio, SUSS MicroTec, Soitec as research leads for further due diligence, not vetted conclusions.

## Sessions

### 2026-07-02 — initial sector scan and comparison

**Sources:**
- https://exoswan.com/photonics-stocks/
- https://blog.st.com/data-silicon-photonics-ai/
- https://semiengineering.com/all-ai-data-center-interconnects-will-be-optical-within-5-years/
- https://www.nature.com/articles/s44310-025-00105-1
- https://semiwiki.com/forum/threads/ofc-2026-summary...
- https://www.tomshardware.com/networking/nvidia-outlines-plans...
- https://futurumgroup.com/insights/nvidias-4b-optics-bet-signals-photonics-as-ais-next-bottleneck/
- https://www.nvidia.com/en-us/networking/products/silicon-photonics/
- SEC 8-K filings: Lumentum (Q1-Q3 FY26), Coherent (Q2-Q3 FY26)
- https://247wallst.com/investing/2026/07/02/applied-optoelectronics-plunges-17-coherent-and-lumentum-sink-10-as-photonics-stocks-reset/
- https://www.tikr.com/blog/widespread-ai-photonics-selloff-drags-down-lumentum-stock
- https://www.tradingkey.com/analysis/stocks/us-stocks/261969604-semianalysis-cpo-delay-optical-selloff-tradingkey
- https://www.cryptopolitan.com/ai-photonics-selloff-bullish-calls-sive-aaoi/
- https://www.kavout.com/market-lens/is-poet-technologies-the-dark-horse-of-ai-infrastructure
- https://seekingalpha.com/article/4916755-poet-technologies-vs-sivers-semiconductors...
- https://www.sivers-semiconductors.com/press/...
- https://money.usnews.com/investing/articles/top-laser-photonics-stocks
- https://www.bbae.com/blog/the-2026-photonics-stocks-rally/
- https://tickeron.com/trading-investing-101/the-photonics-revolution-report-2026...
- https://thequantuminsider.com/2026/03/24/11-companies-lighting-up-the-quantum-photonics-sector/
- https://finance.yahoo.com/markets/stocks/articles/speed-light-5-stocks-powering-170000234.html
- https://www.tipranks.com/stocks/crdo/forecast, https://simplywall.st/stocks/us/semiconductors/nasdaq-crdo/...

**Key findings:**
- Sector-defining shift: pluggable transceivers → CPO → optical I/O chiplets, driven by copper's physical limits at 800G/1.6T+ data rates.
- NVIDIA is the demand anchor with >$6.5B deployed in 2026 YTD into photonics suppliers.
- Two distinct sector-wide selloffs: (1) 2026-06-09 SemiAnalysis CPO yield risk report; (2) 2026-07-02 broader AI-hardware pullback.
- Large-scale CPO deployment is realistically 2028-2030 (Yole Group), not 2026-27 — a material narrative-reality gap.
- Copper is actively fighting back (224G SerDes, AEC extending reach), not a dying technology — hybrid co-packaged copper + CPO will coexist.
- China (TeraHop, Hisense, Accezlink) is closing the tech gap; margin risk in commoditizing pluggable layer.
- Wireless/free-space optics is complementary, not competitive — deployed in access networks, not datacenters.

### Five-Filter Comparison Table (as of 2026-07-02)

| Symbol | Catalyst | Inst. Flow | Chart | Sector | Narrative | Score | Commentary |
|---|---|---|---|---|---|---|---|
| **CRDO** | 🟡 | 🟢 | 🟡 | 🟢 | 🟢 | 4/5 | Strongest set: FY26 rev $1.34B (+206% YoY), FY27 guide >80%, strong PT raises (BofA $340, Stifel $350), hedged across copper (AEC) + optical |
| **FN** | 🟡 | 🟢 | 🟡 | 🟢 | 🟢 | 4/5 | Manufacturing backbone: record Q2 FY26 rev $1.13B (+51.57% YTD), less name-specific volatility, less hawkish on CPO timeline |
| **LITE** | 🟡 | 🟡 | 🔴 | 🟢 | 🟢 | 3/5 | Q3 rev $808M (+90% YoY), OCS backlog $400M+, but flow stale (no new PT raises in 2-4wks), chart hit hard today |
| **COHR** | 🟡 | 🟡 | 🔴 | 🟢 | 🟢 | 3/5 | Q3 rev $1.8B (+21% YoY), datacenter 75% of revenue, but smallest EPS beat in 4 quarters, chart pressure |
| **MRVL** | 🟡 | 🟡 | 🟡 | 🟢 | 🟢 | 3/5 | $5.5B Celestial AI bet + diversified portfolio (not pure CPO), less damaged today (-3% vs -10/-17% peers) |
| **AAOI** | 🟡 | 🔴 | 🔴 | 🟢 | 🟢 | 2/5 | Fundamentals strong (Q1 rev +51% YoY, datacenter doubled) but broke chart support today (-17%), highest execution risk |
| **SIVE** | 🟡 | 🔴 | 🟡 | 🟢 | 🟡 | 2/5 | 25% revenue growth, $453M pipeline, External Light Source niche is real but small, thin coverage |
| **POET** | 🟡 | 🔴 | 🟡 | 🟢 | 🟡 | 1-2/5 | EV ~$1.64B vs ~$2M annualized revenue; rising share count & dilution; value-trap-adjacent signature |
| **ALMU** | 🔴 | 🔴 | 🔴 | 🟢 | 🟡 | 1/5 | Pre-revenue, disruptive GaAs-on-Si manufacturing, but zero institutional signal; highest-risk play |
| **QUBT** | 🟡 | 🔴 | 🟡 | 🟢 | 🟡 | 1-2/5 | Quantum-photonics crossover (Luminar acquisition), but adjacent narrative, not core AI-datacenter-optics |

**Date-specific verdict (as of 2026-07-02):** wait

This is a **tactical verdict tied to chart condition**, not an evergreen conviction:
- Two overlapping selloffs (6/9 yield-risk, 7/2 macro) have made the sector chart red across nearly all names
- CRDO and FN are closest to buy-ready once chart stabilizes (higher-low reclaim on daily)
- LITE/COHR/MRVL remain fundamentally solid but warrant patience for technical confirmation before new money
- Small-caps (SIVE, POET, ALMU, QUBT) are structurally weak on flow/narrative, not just temporarily beaten — remain speculative-sleeve-only regardless of bounce

**Evergreen framework notes:**
- The sector narrative and underlying thesis (CPO is mandatory for >100K-GPU clusters) remain intact and credible
- NVIDIA's $6.5B photonics bet and stated policy ("CPO is not optional") are not marketing theater — they're structural demand anchors
- The realistic CPO ramp timeline (2028-2030) is materially later than many investors seem to be pricing, creating a narrative-reality gap that could extend the current period of volatility

**Follow-ups:**
- Re-run five-filter on CRDO, FN, LITE, COHR, MRVL once the selloff stabilizes (watch for higher-low reclaim on daily chart).
- Track SemiAnalysis / hyperscaler commentary on CPO yield resolution — this is the real swing factor for the whole sector's 2027-2030 growth case.
- Watch Ayar Labs / Lightmatter for IPO filings or acquisition announcements — no current public entry point.
- If considering SIVE/POET/ALMU as speculative sleeve positions, size deliberately small given sub-3/5 framework scores.
- Coherent and Lumentum both report fiscal Q4 later this summer — flag as the next real catalyst window for the large-cap names.
- Verify supply-chain equipment/materials names (AXT, IQE, Ushio, SUSS MicroTec, Soitec, SiTime) independently before treating as watchlist candidates — current sourcing is thin/single-source for several.
- Watch indium/InP export-policy news out of China — the most concrete physical chokepoint identified in the sector.
