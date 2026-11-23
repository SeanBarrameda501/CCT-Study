// Authoring helpers. Correct answer(s) are written first; the build shuffles options
// deterministically so the key is not always "A".
export const SRC = {
  CCI: 'CCI CCT examination matrix & task list (cci-online.org)',
  BOOTH: "Booth & O'Brien, Electrocardiography for Healthcare Professionals (CCI reference)",
  DUBIN: "Dubin, Rapid Interpretation of EKG's, 6th ed. (CCI reference)",
  MARRIOTT: "Wagner & Strauss, Marriott's Practical Electrocardiography (CCI reference)",
  HOLES: "Shier, Butler & Lewis, Hole's Essentials of Human Anatomy & Physiology (CCI reference)",
  AHA_STD: 'Kligfield et al., AHA/ACCF/HRS Recommendations for Standardization of the ECG, Part I (Circulation 2007)',
  AHA_BBB: 'Surawicz et al., AHA/ACCF/HRS Recommendations Part III: Intraventricular Conduction Disturbances (Circulation 2009)',
  AHA_LVH: 'Hancock et al., AHA/ACCF/HRS Recommendations Part V: Chamber Hypertrophy (Circulation 2009)',
  AHA_ISCH: 'Wagner et al., AHA/ACCF/HRS Recommendations Part VI: Acute Ischemia/Infarction (Circulation 2009)',
  UDMI: 'Thygesen et al., Fourth Universal Definition of Myocardial Infarction (2018)',
  AHA_EX: 'Fletcher et al., Exercise Standards for Testing and Training, AHA Scientific Statement (Circulation 2013)',
  ACC_EX: 'Gibbons et al., ACC/AHA 2002 Guideline Update for Exercise Testing',
  ASNC: 'Henzlova et al., ASNC Imaging Guidelines for SPECT Nuclear Cardiology: Stress Protocols (J Nucl Cardiol 2016)',
  ISHNE: 'Steinberg et al., ISHNE-HRS Expert Consensus Statement on Ambulatory ECG and External Cardiac Monitoring (2017)',
  ACLS: 'AHA 2020 Guidelines for CPR and Emergency Cardiovascular Care',
  CDC_ISO: 'CDC/HICPAC 2007 Guideline for Isolation Precautions',
  CDC_HH: 'CDC Guideline for Hand Hygiene in Health-Care Settings (MMWR 2002)',
  CDC_PPE: 'CDC, Sequence for Donning and Removing PPE',
  TJC: 'The Joint Commission, National Patient Safety Goals (NPSG.01.01.01)',
  HIPAA: 'U.S. HHS, Summary of the HIPAA Privacy Rule',
  OSHA: 'OSHA Bloodborne Pathogens Standard, 29 CFR 1910.1030',
  AHA_AMB: 'Drew et al., AHA Practice Standards for Electrocardiographic Monitoring in Hospital Settings (Circulation 2004; update 2017)',
  ACC_PACE: 'Kusumoto et al., 2018 ACC/AHA/HRS Guideline on Bradycardia and Cardiac Conduction Delay',
  AHA_QT: 'Rautaharju et al., AHA/ACCF/HRS Recommendations Part IV: ST Segment, T and U Waves, and the QT Interval (Circulation 2009)',
  FDA: 'FDA prescribing information (DailyMed) for the named drug',
  GEN: 'Standard ECG textbook content (Booth & O\'Brien; Dubin)',
};

let _auto = 0;
const base = (area, sub, d, stem, expl, src, x = {}) => ({ area, subtopic: sub, difficulty: d, stem, explanation: expl, source: src, ...x, _n: _auto++ });
export const make = area => ({
  // single best answer
  M: (sub, d, stem, ans, wrongs, expl, src, x) => ({ ...base(area, sub, d, stem, expl, src, x), type: 'mcq', options: [ans, ...wrongs], answer: 0 }),
  // multiple response: correct list, wrong list
  S: (sub, d, stem, right, wrong, expl, src, x) => ({ ...base(area, sub, d, stem, expl, src, x), type: 'multi', options: [...right, ...wrong], answers: right.map((_, i) => i) }),
  // ordering: items written in the correct order
  O: (sub, d, stem, items, expl, src, x) => ({ ...base(area, sub, d, stem, expl, src, x), type: 'order', items }),
});
