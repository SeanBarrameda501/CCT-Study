// Flashcards: "area|topic|front|back" one per line. Image cards for every rhythm are added by the build.
export default `
A|Orders|What must every ECG order identify?|Patient, procedure, protocol, ordering provider, and any limitations/prep instructions.
A|Orders|Meaning of STAT|Immediately — perform ahead of routine work.
A|Orders|Order conflicts with what the patient says — what do you do?|Perform only what is ordered and clarify with the ordering provider.
A|Orders|Patient can't walk but has a treadmill order|Contact the provider; they may change it to a pharmacologic stress test.
A|Orders|Beta blocker was supposed to be held but wasn't|Notify the physician before starting the stress test.
A|Orders|Verbal orders are acceptable when?|In urgent/emergency situations, documented and authenticated per policy.
A|Identification|How many patient identifiers are required?|At least two (e.g., name and date of birth) — Joint Commission NPSG.01.01.01.
A|Identification|Is a room number an identifier?|No — never use room or bed number.
A|Identification|Best way to ask an alert patient's identity|Open-ended: "Please tell me your full name and date of birth."
A|Identification|Unidentified unconscious patient|Use the facility's temporary/trauma identification system.
A|Identification|What does HIPAA protect?|Privacy and security of protected health information (PHI).
A|Identification|Labels required on every tracing|Patient name/ID, date and time of recording.
A|Identification|Wrong patient on an ECG — action?|Report to supervisor and correct through the official process.
A|Consent|Implied consent example|Patient lies down and cooperates after you explain a routine ECG.
A|Consent|Which test usually needs written informed consent?|Stress testing (exercise or pharmacologic).
A|Consent|Elements of informed consent|Purpose, risks, benefits and alternatives.
A|Consent|Who consents for a minor?|A parent or legal guardian.
A|Consent|Healthcare proxy|Person legally designated to make decisions when the patient lacks capacity.
A|Consent|Competent patient refuses the ECG|Do not perform it; notify the nurse/provider and document.
A|Consent|Emergency, unconscious patient, no surrogate|Care proceeds under implied (emergency) consent.
A|Infection control|#1 way to prevent infection spread|Hand hygiene.
A|Infection control|Standard precautions apply to…|All patients.
A|Infection control|Hand hygiene for C. diff|Soap and water (alcohol does not kill spores).
A|Infection control|Contact precautions PPE|Gown and gloves (e.g., MRSA, C. diff).
A|Infection control|Droplet precautions PPE|Surgical mask when close to the patient (e.g., influenza).
A|Infection control|Airborne precautions|N95 respirator + negative-pressure room (TB, measles, varicella).
A|Infection control|PPE donning order|Gown → mask/respirator → goggles/face shield → gloves.
A|Infection control|PPE doffing order (CDC example)|Gloves → goggles/face shield → gown → mask/respirator, then hand hygiene.
A|Infection control|Needlestick first steps|Wash with soap and water; report immediately per exposure plan.
A|Infection control|Cleaning lead wires|Approved low-level disinfectant per manufacturer between patients.
A|Transfer & transport|First step before a wheelchair transfer|Lock the brakes.
A|Transfer & transport|Body mechanics|Bend knees, wide base, keep load close, no twisting.
A|Transfer & transport|Hemiparesis transfer|Lead with the patient's strong side.
A|Transfer & transport|Where does a gait belt go?|Around the waist, over clothing.
A|Transfer & transport|Stretcher transport rules|Rails up, feet first, never unattended.
A|Landmarks|Angle of Louis marks…|The 2nd rib / 2nd intercostal space.
A|Landmarks|V1 location|4th ICS, right sternal border.
A|Landmarks|V2 location|4th ICS, left sternal border.
A|Landmarks|V3 location|Midway between V2 and V4.
A|Landmarks|V4 location|5th ICS, left midclavicular line.
A|Landmarks|V5 location|Left anterior axillary line, level with V4.
A|Landmarks|V6 location|Left midaxillary line, level with V4.
A|Landmarks|Chest electrodes on large breasts|Under the breast on the chest wall, not on breast tissue.
A|Patient prep|Standard ECG position|Supine and relaxed (semi-Fowler's if dyspneic — note it).
A|Patient prep|Skin prep sequence|Clip hair, clean, dry, lightly abrade, apply electrode.
A|Patient prep|Why abrade skin for stress/Holter?|Removes dead skin to lower impedance and motion artifact.
A|Patient prep|Electrode check before use|Moist gel, not expired, same manufacturer.
A|Patient prep|Amputee electrode placement|On the stump/proximal limb; keep the opposite side symmetric.
A|Safety|Microshock risk|Patients with pacing wires/central lines — tiny currents reach the heart.
A|Safety|Adult CPR rate and depth|100–120/min, at least 2 inches (5 cm).
A|Safety|Vasovagal faint|Lay flat, elevate legs, monitor, get help.
A|Patient education|Patient asks "Is my ECG normal?"|"Your physician will review the results with you."
`.trim().split('\n').concat(`
B|Supplies|Electrodes for a 12-lead|10 (4 limb + 6 chest).
B|Supplies|Leads (views) in a 12-lead|12.
B|Supplies|Purpose of the RL electrode|Ground/reference to reduce interference.
B|Supplies|AHA color: RA|White.
B|Supplies|AHA color: LA|Black.
B|Supplies|AHA color: LL|Red.
B|Supplies|AHA color: RL|Green.
B|Supplies|IEC color: RA|Red.
B|Supplies|IEC color: LA|Yellow.
B|Supplies|IEC color: LL|Green.
B|Supplies|IEC color: RL|Black.
B|Supplies|AHA chest lead colors V1–V6|Red, yellow, green, blue, orange, purple.
B|Supplies|Three-channel machine|Records three leads simultaneously.
B|Supplies|Each column on a 3 × 4 printout|2.5 seconds.
B|Supplies|Length of a standard 12-lead recording|10 seconds.
B|Lead systems|Bipolar limb leads|I, II, III.
B|Lead systems|Unipolar leads|aVR, aVL, aVF and V1–V6.
B|Lead systems|Lead I polarity|RA negative → LA positive (0°).
B|Lead systems|Lead II polarity|RA negative → LL positive (+60°).
B|Lead systems|Lead III polarity|LA negative → LL positive (+120°).
B|Lead systems|Einthoven's law|Lead I + Lead III = Lead II.
B|Lead systems|aVR angle|−150°.
B|Lead systems|aVL angle|−30°.
B|Lead systems|aVF angle|+90°.
B|Lead systems|Precordial leads view which plane?|Horizontal (transverse).
B|Lead systems|Limb leads view which plane?|Frontal.
B|Lead systems|Normal appearance of aVR|Negative P, QRS and T.
B|Lead systems|Wave moving toward positive electrode|Upright deflection.
B|Lead systems|Wave perpendicular to a lead|Small biphasic (equiphasic) complex.
B|Lead systems|Perpendicular lead pairs|I–aVF, II–aVL, III–aVR.
B|Lead systems|Reference for precordial leads|Wilson's central terminal.
B|Calibration & paper|Standard paper speed|25 mm/s.
B|Calibration & paper|Standard calibration|10 mm = 1 mV.
B|Calibration & paper|Small box (25 mm/s)|0.04 s and 0.1 mV.
B|Calibration & paper|Large box (25 mm/s)|0.20 s and 0.5 mV.
B|Calibration & paper|Large boxes per second|5.
B|Calibration & paper|Large boxes in 6 seconds|30.
B|Calibration & paper|Half standard|5 mm/mV — waves half as tall.
B|Calibration & paper|Double standard|20 mm/mV — waves twice as tall.
B|Calibration & paper|Small box at 50 mm/s|0.02 s.
B|Calibration & paper|Sensitivity (gain) control|Signal amplification.
B|Calibration & paper|Diagnostic filter (adult)|0.05 Hz – 150 Hz.
B|Calibration & paper|Problem with a 0.5–40 Hz monitor filter on a 12-lead|Can distort the ST segment and reduce QRS amplitude.
B|Calibration & paper|True amplitude formula|Height (mm) ÷ calibration (mm/mV).
B|Troubleshooting|Somatic tremor appearance|Irregular, jittery, high-frequency baseline.
B|Troubleshooting|Somatic tremor fixes|Warm, relax, support limbs; move limb electrodes proximally.
B|Troubleshooting|60-cycle interference appearance|Uniform, regular, fine "fuzzy" baseline.
B|Troubleshooting|60-cycle fixes|Unplug devices, check grounding, route cables away from cords.
B|Troubleshooting|Wandering baseline causes|Breathing, movement, lotion, poor contact, cable tension.
B|Troubleshooting|One lead flat, others fine|Loose/disconnected electrode or wire.
B|Troubleshooting|"VF" on screen but patient talking|Artifact — check the patient and leads.
B|Troubleshooting|Lead I inverted, aVR upright|Left arm/right arm reversal (or dextrocardia).
B|Troubleshooting|LA/RA reversal swaps|II ↔ III and aVR ↔ aVL; inverts I.
B|Troubleshooting|Nearly flat limb lead|Reversal involving the RL (ground) electrode.
B|Troubleshooting|V1–V2 placed too high|rSr' or poor R progression mimicking RBBB/MI.
B|Troubleshooting|Troubleshooting order|Patient → electrodes → wires → machine → environment.
B|Troubleshooting|AC notch filter|Removes 60 Hz (or 50 Hz) power-line noise.
B|Troubleshooting|Diaphoretic patient, electrodes falling off|Dry skin, fresh electrodes, secure wires.
B|12-lead procedure|Which chest lead is placed before V3?|V4.
B|12-lead procedure|Why enter age and sex?|Computer interpretation criteria depend on them.
B|12-lead procedure|Chest pain during ECG|Finish quickly; give to nurse/physician immediately.
B|12-lead procedure|Final check before removing electrodes|All leads present, labeled, artifact-free, calibration shown.
B|Modified ECG|V4R location|5th ICS, right midclavicular line.
B|Modified ECG|V7 location|Left posterior axillary line, level with V6.
B|Modified ECG|V8 location|Tip of left scapula (mid-scapular line).
B|Modified ECG|V9 location|Left paraspinal border.
B|Modified ECG|15-lead adds|V4R, V8, V9.
B|Modified ECG|Right-sided leads detect|Right ventricular infarction.
B|Modified ECG|Posterior leads detect|Posterior wall MI.
B|Modified ECG|Dextrocardia ECG technique|Reverse arm electrodes; mirror chest leads on right; relabel.
B|Modified ECG|Lewis lead purpose|Enhances atrial activity (P/flutter waves).
B|Modified ECG|MCL1 approximates|V1.
B|Modified ECG|Normal newborn axis|Right axis (RV dominance).
`.trim().split('\n')).concat(`
C|Anatomy & physiology|Chambers of the heart|Four: two atria, two ventricles.
C|Anatomy & physiology|Chamber that pumps blood to the aorta|Left ventricle.
C|Anatomy & physiology|Normal pacemaker|SA node.
C|Anatomy & physiology|Conduction pathway|SA → atria → AV node → His → bundle branches → Purkinje.
C|Anatomy & physiology|Right AV valve|Tricuspid.
C|Anatomy & physiology|Left AV valve|Mitral (bicuspid).
C|Anatomy & physiology|Semilunar valves|Pulmonic and aortic.
C|Anatomy & physiology|Heart wall layers (inside out)|Endocardium, myocardium, epicardium (+ pericardium).
C|Anatomy & physiology|P wave|Atrial depolarization.
C|Anatomy & physiology|QRS complex|Ventricular depolarization.
C|Anatomy & physiology|T wave|Ventricular repolarization.
C|Anatomy & physiology|Where is atrial repolarization?|Hidden in the QRS.
C|Anatomy & physiology|Cardiac output formula|CO = HR × SV.
C|Anatomy & physiology|Normal resting cardiac output|About 4–8 L/min.
C|Anatomy & physiology|Vagal (parasympathetic) effect|Slows HR and AV conduction.
C|Anatomy & physiology|Sympathetic effect|Speeds HR, conduction and contractility.
C|Anatomy & physiology|When do coronaries fill?|Diastole.
C|Anatomy & physiology|Atrial kick contribution|~20–30% of ventricular filling.
C|Anatomy & physiology|SA node intrinsic rate|60–100/min.
C|Anatomy & physiology|AV junction intrinsic rate|40–60/min.
C|Anatomy & physiology|Ventricular intrinsic rate|20–40/min.
C|Anatomy & physiology|Normal septal depolarization|Left → right (small q in I, aVL, V5–V6; small r in V1).
C|Anatomy & physiology|Exchange vessels|Capillaries.
C|Anatomy & physiology|Resistance vessels|Arterioles.
C|Anatomy & physiology|Arteries vs veins|Arteries carry blood away from the heart; veins toward it.
C|Anatomy & physiology|RCA usually supplies|Inferior wall, SA node (~60%), AV node (~90%), RV.
C|Anatomy & physiology|LAD supplies|Anterior wall and anterior septum.
C|Anatomy & physiology|Circumflex supplies|Lateral wall (± posterior).
C|Anatomy & physiology|Left bundle fascicles|Left anterior and left posterior.
C|Anatomy & physiology|Normal BP (ACC/AHA 2017)|< 120/80 mm Hg.
C|Axis|Normal axis|−30° to +90°.
C|Axis|Left axis deviation|−30° to −90°.
C|Axis|Right axis deviation|+90° to +180°.
C|Axis|Extreme axis|−90° to ±180° (I and aVF both negative).
C|Axis|I +, aVF +|Normal axis.
C|Axis|I +, aVF −, II −|Left axis deviation.
C|Axis|I −, aVF +|Right axis deviation.
C|Axis|Equiphasic lead method|Axis is perpendicular to the most equiphasic limb lead.
C|Axis|Common causes of LAD|LAFB, inferior MI, LVH, LBBB.
C|Axis|Common causes of RAD|RVH, COPD, acute PE, LPFB, normal newborn.
C|Bundle branch block|Complete BBB QRS duration|≥ 0.12 s.
C|Bundle branch block|Incomplete RBBB QRS|0.110–0.119 s with RBBB pattern.
C|Bundle branch block|RBBB V1 pattern|rSR' ("rabbit ears").
C|Bundle branch block|RBBB lateral leads|Wide slurred S in I, aVL, V5–V6.
C|Bundle branch block|LBBB V1 pattern|Deep QS or rS.
C|Bundle branch block|LBBB lateral leads|Broad notched R, no septal q (I, aVL, V5–V6).
C|Bundle branch block|LBBB ST-T|Discordant (opposite the QRS).
C|Bundle branch block|Turn-signal rule|V1 terminal up = RBBB; down = LBBB.
C|Bundle branch block|Bifascicular block|RBBB + LAFB (or LPFB).
C|Bundle branch block|New LBBB + chest pain|Report urgently — may mask/mimic MI.
C|Hypertrophy|Sokolow-Lyon LVH|S V1 + R V5/V6 ≥ 35 mm.
C|Hypertrophy|LVH strain pattern|Lateral ST depression + asymmetric T inversion.
C|Hypertrophy|RVH clues|R ≥ S in V1, right axis deviation.
C|Hypertrophy|P pulmonale|Tall P ≥ 2.5 mm in II — right atrial enlargement.
C|Hypertrophy|P mitrale|Wide notched P ≥ 0.12 s — left atrial enlargement.
C|Hypertrophy|Common cause of LVH|Hypertension (also aortic stenosis).
C|Hypertrophy|Conditions lowering QRS voltage|Obesity, pericardial effusion, COPD.
C|Ischemia & infarction|Inferior leads|II, III, aVF.
C|Ischemia & infarction|Septal leads|V1, V2.
C|Ischemia & infarction|Anterior leads|V3, V4.
C|Ischemia & infarction|Lateral leads|I, aVL, V5, V6.
C|Ischemia & infarction|High lateral leads|I, aVL.
C|Ischemia & infarction|Inferior MI artery|RCA (usually).
C|Ischemia & infarction|Anterior/septal MI artery|LAD.
C|Ischemia & infarction|Lateral MI artery|Left circumflex.
C|Ischemia & infarction|Posterior MI on 12-lead|ST depression + tall R in V1–V3.
C|Ischemia & infarction|Confirm posterior MI with|V7–V9 ST elevation.
C|Ischemia & infarction|RV infarct lead|V4R.
C|Ischemia & infarction|Ischemia ECG sign|ST depression and/or T-wave inversion.
C|Ischemia & infarction|Injury ECG sign|ST elevation.
C|Ischemia & infarction|Necrosis ECG sign|Pathologic Q waves.
C|Ischemia & infarction|Pathologic Q wave|≥ 0.04 s wide or ≥ 25% of R height.
C|Ischemia & infarction|STEMI threshold (most leads)|≥ 1 mm in 2 contiguous leads.
C|Ischemia & infarction|STEMI V2–V3, men ≥ 40|≥ 2 mm.
C|Ischemia & infarction|STEMI V2–V3, women|≥ 1.5 mm.
C|Ischemia & infarction|Where ST elevation is measured|J point vs baseline.
C|Ischemia & infarction|STEMI evolution|Hyperacute T → ST↑ → Q waves → T inversion → ST normalizes.
C|Ischemia & infarction|Reciprocal changes|ST depression in leads opposite the injured wall.
C|Ischemia & infarction|Reciprocal leads for inferior MI|I, aVL.
C|Ischemia & infarction|Reciprocal leads for high lateral MI|II, III, aVF.
C|Ischemia & infarction|Inferior MI + bradycardia/AV block — why?|RCA supplies SA/AV nodes.
C|Ischemia & infarction|Pericarditis ECG|Diffuse concave ST↑, PR depression, no reciprocal (except aVR).
C|Ischemia & infarction|Normal R-wave transition|V3–V4.
C|Ischemia & infarction|Poor R-wave progression causes|Old anterior MI, LVH, LBBB, COPD, high V1–V2 placement.
C|Ischemia & infarction|Wellens' T waves|Deep/biphasic T V2–V3 → critical proximal LAD stenosis.
C|Ischemia & infarction|Hyperkalemia|Peaked T → wide QRS → flat P → sine wave.
C|Ischemia & infarction|Hypokalemia|Flat T, U waves.
C|Ischemia & infarction|Hypercalcemia|Short QT.
C|Ischemia & infarction|Hypocalcemia|Long QT.
C|Ischemia & infarction|WPW triad|Short PR, delta wave, wide QRS.
C|Ischemia & infarction|Wall not viewed by the 12-lead|Posterior.
C|Ischemia & infarction|Contiguous leads|Leads viewing the same region (e.g., II, III, aVF).
C|Ischemia & infarction|Sgarbossa concept|Concordant ST↑ ≥ 1 mm in LBBB suggests acute MI.
C|Ischemia & infarction|Bazett formula|QTc = QT ÷ √RR.
C|Ischemia & infarction|Prolonged QTc (AHA)|≥ 0.45 s men, ≥ 0.46 s women.
C|Ischemia & infarction|QTc high-risk threshold|> 0.50 s.
`.trim().split('\n')).concat(`
D|Stress supplies|Must-have emergency equipment|Defibrillator, crash cart, airway equipment, ACLS drugs.
D|Stress supplies|Mason-Likar placement|Limb electrodes moved to the torso for exercise.
D|Stress supplies|Why record supine and standing baselines?|Posture/torso placement can change the ECG.
D|Stress equipment|Common exercise modalities|Treadmill and cycle ergometer.
D|Stress equipment|Cycle workload unit|Watts.
D|Stress equipment|1 MET|3.5 mL O2/kg/min (resting).
D|Stress equipment|Gripping the handrails|Overestimates capacity and adds artifact.
D|Stress equipment|Functional capacity unit|METs.
D|Protocols|Most common treadmill protocol|Bruce.
D|Protocols|Bruce stage length|3 minutes.
D|Protocols|Bruce stage 1|1.7 mph, 10%.
D|Protocols|Bruce stage 2|2.5 mph, 12%.
D|Protocols|Bruce stage 3|3.4 mph, 14%.
D|Protocols|Bruce stage 4|4.2 mph, 16%.
D|Protocols|Bruce stage 5|5.0 mph, 18%.
D|Protocols|Modified Bruce first two stages|1.7 mph 0%, then 1.7 mph 5%.
D|Protocols|Naughton protocol|Small increments for low-capacity patients.
D|Protocols|Balke protocol|Constant speed, gradually increasing grade.
D|Protocols|Ideal test duration|8–12 minutes.
D|Protocols|Age-predicted max HR|220 − age.
D|Protocols|Target HR for adequate test|≥ 85% of age-predicted max.
D|Protocols|Normal SBP response|Rises with workload (~10 mm Hg/MET).
D|Protocols|Double product|HR × SBP.
D|Protocols|Positive exercise ECG|≥ 1 mm horizontal/downsloping ST↓ 60–80 ms after J.
D|Protocols|Rapid upsloping J-point depression|Usually normal.
D|Protocols|Minimum recovery monitoring|5–6 min or until stable.
D|Protocols|Chronotropic incompetence|Failure to reach expected HR (without beta blockers).
D|Protocols|Abnormal HR recovery|≤ 12 bpm drop in the first minute (upright cool-down).
D|Contraindications|Absolute: MI timing|Acute MI within 2 days.
D|Contraindications|Absolute: valve|Symptomatic severe aortic stenosis.
D|Contraindications|Absolute: vascular|Acute aortic dissection, acute PE.
D|Contraindications|Absolute: inflammatory|Acute myocarditis or pericarditis.
D|Contraindications|Absolute: heart failure|Uncontrolled symptomatic (decompensated) HF.
D|Contraindications|Relative: blood pressure|Resting > 200/110 mm Hg.
D|Contraindications|Relative: coronary|Known left main stenosis.
D|Contraindications|Relative: conduction|High-degree AV block.
D|Contraindications|Relative: other|Electrolyte abnormalities, HCM with obstruction, moderate stenotic valve disease.
D|Endpoints|Absolute: ST change|ST elevation > 1 mm in leads without Q waves (not V1/aVR).
D|Endpoints|Absolute: BP|SBP drop > 10 mm Hg with other evidence of ischemia.
D|Endpoints|Absolute: symptoms|Moderate–severe angina; CNS symptoms (ataxia, near-syncope).
D|Endpoints|Absolute: arrhythmia|Sustained VT.
D|Endpoints|Absolute: other|Poor perfusion signs, can't monitor ECG/BP, patient asks to stop.
D|Endpoints|Relative: ST depression|> 2 mm horizontal/downsloping.
D|Endpoints|Relative: BP|SBP > 250 and/or DBP > 115.
D|Endpoints|Relative: arrhythmias|Multifocal PVCs, triplets, SVT, heart block, bradyarrhythmias.
D|Endpoints|Relative: symptoms|Fatigue, SOB, wheezing, leg cramps, claudication, increasing chest pain.
D|Pharmacologic & nuclear|Vasodilator stress agents|Adenosine, regadenoson, dipyridamole.
D|Pharmacologic & nuclear|Vasodilator reversal agent|Aminophylline.
D|Pharmacologic & nuclear|Hold before vasodilator stress|Caffeine, 12–24 h.
D|Pharmacologic & nuclear|Dobutamine mechanism|β1 stimulation ↑ HR and contractility.
D|Pharmacologic & nuclear|Regadenoson dose|0.4 mg IV bolus + saline flush.
D|Pharmacologic & nuclear|Reversible perfusion defect|Ischemia.
D|Pharmacologic & nuclear|Fixed perfusion defect|Scar/infarct (or attenuation).
D|Pharmacologic & nuclear|Preferred stress for LBBB/paced|Vasodilator perfusion imaging.
D|Stress patient care|Borg scale|Rating of perceived exertion.
`.trim().split('\n')).concat(`
E|Holter basics|Holter duration|24–48 hours, continuous.
E|Holter basics|Event/loop recorder duration|Up to ~30 days.
E|Holter basics|Implantable loop recorder|Up to ~3 years, for rare symptoms (e.g., syncope).
E|Holter basics|Mobile cardiac telemetry|Auto-detects and transmits events in near real time.
E|Holter basics|Patch monitor|Single-lead adhesive, days to ~2 weeks.
E|Holter basics|Purpose of the diary|Correlate symptoms/activities with rhythm.
E|Holter basics|Daily palpitations — best monitor|24–48 h Holter.
E|Holter basics|Symptoms every 2 weeks — best monitor|Event/loop or MCT for up to 30 days.
E|Holter equipment|Pre-hookup checks|Battery, correct clock, intact wires, memory cleared.
E|Holter equipment|Post-hookup check|Verify clean signal on every channel.
E|Holter equipment|Typical channels|2–3 (5 or 7 electrodes); 12-lead Holters exist.
E|Holter application|Electrode sites|Over bone (sternum, ribs), avoid muscle.
E|Holter application|Stress (strain-relief) loops|Taped wire loops that prevent tugging.
E|Holter education|Water rule|Keep the recorder dry — no bathing/swimming.
E|Holter education|Activity rule|Continue normal daily activities.
E|Holter education|Emergency while wearing a Holter|Call 911 — the Holter is not an alarm.
E|Holter education|Avoid near the recorder|Electric blankets, strong magnets.
E|Holter troubleshooting|Flat line in one channel|Loose electrode/broken wire.
E|Holter troubleshooting|Recording too short|Battery/memory problem or early removal.
E|Holter troubleshooting|Motion artifact can mimic|Ventricular tachycardia.
E|Holter analysis|Common normal sleep finding|Sinus bradycardia.
`.trim().split('\n')).concat(`
F|Intervals & waveforms|Normal PR|0.12–0.20 s.
F|Intervals & waveforms|Normal QRS|< 0.12 s (usually 0.06–0.10).
F|Intervals & waveforms|Normal P duration|≤ 0.11–0.12 s.
F|Intervals & waveforms|PR measured from|Start of P to start of QRS.
F|Intervals & waveforms|QT measured from|Start of QRS to end of T.
F|Intervals & waveforms|ST segment|J point to start of T.
F|Intervals & waveforms|J point|Junction of QRS end and ST start.
F|Intervals & waveforms|U wave significance|Often normal; prominent = hypokalemia.
F|Intervals & waveforms|Long QT risk|Torsades de pointes.
F|Intervals & waveforms|Inverted P with PR < 0.12 s in II|Junctional origin.
F|Intervals & waveforms|At 60 bpm, QTc equals|The measured QT (RR = 1 s).
F|Intervals & waveforms|Delta wave|Slurred QRS upstroke — pre-excitation (WPW).
F|Rate calculation|300 method sequence|300, 150, 100, 75, 60, 50.
F|Rate calculation|1,500 method|1500 ÷ small boxes between R waves.
F|Rate calculation|Irregular rhythm rate|QRS in 6 s × 10.
F|Rate calculation|R–R 0.60 s|100 bpm.
F|Rate calculation|R–R 1.00 s|60 bpm.
F|Rate calculation|R–R 0.40 s|150 bpm.
F|Rate calculation|R–R 1.50 s|40 bpm.
F|Rate calculation|20 small boxes|75 bpm.
F|Rate calculation|10 small boxes|150 bpm.
F|Rate calculation|25 small boxes|60 bpm.
F|Rate calculation|3 large boxes|100 bpm.
F|Rate calculation|5 large boxes|60 bpm.
F|Rate calculation|6 large boxes|50 bpm.
F|Rate calculation|Atrial rate method|Measure P–P (or F–F) intervals.
F|Sinus rhythms|Sinus P wave in lead II|Upright, before every QRS, uniform.
F|Sinus rhythms|Sinus bradycardia rate|< 60 bpm.
F|Sinus rhythms|Sinus tachycardia rate|> 100 bpm.
F|Sinus rhythms|Sinus arrhythmia hallmark|R–R varies with respiration (≥ 0.16 s).
F|Sinus rhythms|Sinus arrest vs exit block|Arrest pause is not a multiple of the P–P; exit block pause is.
F|Atrial rhythms|PAC hallmark|Early beat, different P, narrow QRS, non-compensatory pause.
F|Atrial rhythms|Atrial fibrillation hallmark|No P waves, irregularly irregular.
F|Atrial rhythms|Atrial fibrillation atrial rate|350–600/min (fibrillatory waves).
F|Atrial rhythms|Atrial flutter wave rate|~250–350/min (classically 300).
F|Atrial rhythms|Flutter waves best seen in|II, III, aVF (and V1).
F|Atrial rhythms|Regular narrow tachycardia at 150|Consider atrial flutter with 2:1 block.
F|Atrial rhythms|SVT rate|~150–250 bpm.
F|Atrial rhythms|MAT criteria|≥ 3 P shapes, rate > 100, irregular.
F|Atrial rhythms|WAP criteria|≥ 3 P shapes, rate < 100.
F|Atrial rhythms|Loss of atrial kick occurs in|Atrial fibrillation.
F|Junctional rhythms|Junctional escape rate|40–60 bpm.
F|Junctional rhythms|Accelerated junctional rate|60–100 bpm.
F|Junctional rhythms|Junctional tachycardia rate|> 100 bpm.
F|Junctional rhythms|Junctional P-wave positions|Before (short PR, inverted), hidden, or after QRS.
F|Junctional rhythms|PJC|Early narrow beat with inverted/absent P.
F|Ventricular rhythms|PVC hallmark|Early, wide, bizarre, no P, T opposite.
F|Ventricular rhythms|Compensatory pause|R–R around PVC = 2 normal R–R.
F|Ventricular rhythms|Bigeminy|Every other beat is a PVC.
F|Ventricular rhythms|Trigeminy|Every third beat is a PVC.
F|Ventricular rhythms|Couplet|Two PVCs in a row.
F|Ventricular rhythms|Run of VT|≥ 3 consecutive PVCs.
F|Ventricular rhythms|Multifocal PVCs|Different shapes — more than one focus.
F|Ventricular rhythms|R-on-T PVC|PVC falls on the T wave — can trigger VT/VF.
F|Ventricular rhythms|VT criteria|≥ 3 wide complexes, rate > 100, regular, no related P.
F|Ventricular rhythms|Sustained VT|≥ 30 seconds or needing intervention.
F|Ventricular rhythms|Torsades appearance|Polymorphic VT twisting around the baseline.
F|Ventricular rhythms|VF appearance|Chaotic, no P/QRS/T.
F|Ventricular rhythms|Asystole confirmation|Two leads, check connections and gain.
F|Ventricular rhythms|Idioventricular rate|20–40 bpm, wide.
F|Ventricular rhythms|Accelerated idioventricular rate|40–100 bpm, wide.
F|Heart blocks|First-degree AV block|PR > 0.20 s, constant, 1:1.
F|Heart blocks|Mobitz I|PR progressively lengthens until a QRS drops.
F|Heart blocks|Mobitz II|Constant PR with sudden dropped QRS.
F|Heart blocks|Which 2nd-degree block is more dangerous?|Mobitz II (infranodal; may progress to complete block).
F|Heart blocks|2:1 AV block|Every other P not conducted; type can't be determined from strip.
F|Heart blocks|Third-degree block|P and QRS independent; atrial rate > ventricular.
F|Heart blocks|3rd-degree narrow escape|Junctional, 40–60.
F|Heart blocks|3rd-degree wide escape|Ventricular, 20–40.
F|Heart blocks|Grouped beating suggests|Mobitz I (Wenckebach).
F|Pacemakers|NBG position 1|Chamber paced.
F|Pacemakers|NBG position 2|Chamber sensed.
F|Pacemakers|NBG position 3|Response to sensing (I, T, D).
F|Pacemakers|NBG position 4|Rate modulation (R).
F|Pacemakers|VVI|Ventricle paced, ventricle sensed, inhibited.
F|Pacemakers|DDD|Dual paced, dual sensed, dual response.
F|Pacemakers|Ventricular paced QRS|Wide, after a spike.
F|Pacemakers|Failure to capture|Spike with no following P/QRS.
F|Pacemakers|Failure to sense|Spikes fire despite intrinsic beats.
F|Pacemakers|Oversensing|Pacer inhibited by noise → pauses without spikes.
F|Pacemakers|Magnet over a pacemaker|Asynchronous (fixed-rate) pacing.
F|Artifact|Artifact vs real arrhythmia|QRS complexes continue on time through artifact.
F|Artifact|Tremor can mimic|Atrial flutter or fibrillation.
F|Life-threatening|Shockable rhythms|VF and pulseless VT.
F|Life-threatening|Non-shockable arrest rhythms|Asystole and PEA.
F|Life-threatening|PEA|Organized rhythm without a pulse.
F|Life-threatening|First step when you see VT on the monitor|Check the patient (responsive? pulse?) and call for help.
F|Report & communicate|Report a critical rhythm|Immediately, with read-back confirmation.
F|Report & communicate|Strip label must include|Patient ID, date, time, lead.
F|Medications|-olol drugs|Beta blockers: ↓HR, ↑PR.
F|Medications|-pril drugs|ACE inhibitors: cough, ↑K.
F|Medications|-sartan drugs|ARBs.
F|Medications|Diltiazem/verapamil|Non-DHP CCBs: ↓HR, ↓AV conduction.
F|Medications|Vaughan Williams classes|I Na, II β-blocker, III K, IV Ca.
F|Medications|Class III ECG effect|QT prolongation (amiodarone, sotalol, dofetilide).
F|Medications|Class I ECG effect|QRS widening (Na-channel block).
F|Medications|Digoxin effect|Scooped ST depression, short QT.
F|Medications|Digoxin toxicity worsened by|Hypokalemia.
F|Medications|Adenosine use|SVT — rapid IV push + flush; brief asystole expected.
F|Medications|Atropine use|Symptomatic bradycardia.
F|Medications|Epinephrine in arrest|1 mg IV/IO every 3–5 min.
F|Medications|Amiodarone in ACLS|Shock-refractory VF/pVT.
F|Medications|Magnesium sulfate|Torsades de pointes.
F|Medications|Loop diuretics and the ECG|Hypokalemia → U waves, flat T.
F|Medications|Nitroglycerin + sildenafil|Severe hypotension — avoid.
F|Medications|Anticoagulant examples|Warfarin, heparin, apixaban.
`.trim().split('\n')).map(l => l.split('|'));
