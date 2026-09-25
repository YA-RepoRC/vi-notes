/* ===== Inspection schema =====
 * Field types: text, num, date, area, select, multi, yn, status, lr, tread, table, heading
 * Every field/heading can take photos. Edit freely — the app renders from this.
 */
const STATUS_OPTS = ['Unremarkable', 'Comment', 'Not Evaluated'];
const INTACT = ['Intact', 'Broken Out', 'N/A'];

function tireBlock(p, label, spare) {
  const f = [
    { id: p + '_hdr', type: 'heading', label },
    { id: p + '_brand', label: 'Brand', type: 'text' },
    { id: p + '_model', label: 'Model', type: 'text' },
    { id: p + '_size', label: 'Size', type: 'text' },
    { id: p + '_dot', label: 'DOT', type: 'text' },
    { id: p + '_psi', label: 'Pressure (PSI)', type: 'num' },
    { id: p + '_unseated', label: 'Unseated', type: 'yn' },
    { id: p + '_tread', label: 'Tread Depth (/32")', type: 'tread', full: true },
    { id: p + '_wsize', label: 'Wheel Size', type: 'text' },
    { id: p + '_wmat', label: 'Wheel Material', type: 'select', opts: ['Steel', 'Aluminum', 'Other'] },
    { id: p + '_oe', label: 'O.E. Type', type: 'yn' },
    { id: p + '_valve', label: 'Valve Stem Position', type: 'text', hint: 'clock position / relative to damage' },
  ];
  if (spare) f.push(
    { id: p + '_loc', label: 'Location', type: 'text' },
    { id: p + '_kind', label: 'Spare Type', type: 'select', opts: ['Full Size', 'Compact', 'None / Inflator Kit'] }
  );
  f.push({ id: p + '_notes', label: 'Notes', type: 'area', full: true });
  return f;
}

function beltBlock(p, label, opts = {}) {
  const f = [
    { id: p + '_hdr', type: 'heading', label, na: true },
    { id: p + '_type', label: 'Type', type: 'multi', opts: ['2 Point', '3 Point', 'Manual', 'Automatic'] },
    { id: p + '_retr', label: 'Retractor', type: 'multi', opts: ['ELR', 'ALR', 'Webbing Sensitive', 'Vehicle Sensitive', 'Switchable'] },
    { id: p + '_latch', label: 'Latch Plate', type: 'text' },
    { id: p + '_buckle', label: 'Latch Plate / Buckle Function', type: 'select', opts: ['Functional', 'Not Functional', 'Not Evaluated'] },
  ];
  if (!opts.center) f.push({ id: p + '_dring', label: 'D-Ring', type: 'select', opts: ['Adjustable', 'Fixed'] });
  f.push({ id: p + '_web', label: 'Webbing', type: 'multi', opts: ['Intact', 'Found in Stowed Position', 'Intentionally Cut', 'Load Marks', 'Transfer Marks', 'Fraying / Damage'], full: true });
  if (opts.pt) f.push(
    { id: p + '_ptloc', label: 'Pre-Tensioner Location', type: 'multi', opts: ['Retractor', 'Buckle', 'Anchor', 'None'] },
    { id: p + '_ptfired', label: 'Pre-Tensioner Fired', type: 'select', opts: ['Yes', 'No', 'Not Evaluated'] }
  );
  f.push({ id: p + '_notes', label: 'Notes', type: 'area', full: true });
  return f;
}

function airbagBlock(p, label) {
  return [
    { id: p + '_hdr', type: 'heading', label, na: true },
    { id: p + '_eq', label: 'Equipped', type: 'yn' },
    { id: p + '_dep', label: 'Deployed', type: 'yn' },
    { id: p + '_dia', label: 'Diameter / Size', type: 'text' },
    { id: p + '_vent', label: 'Vent Size', type: 'text' },
    { id: p + '_ventloc', label: 'Vent Locations', type: 'text' },
    { id: p + '_mat', label: 'Material', type: 'text' },
    { id: p + '_tether', label: 'Tethers', type: 'select', opts: ['Intact', 'Torn', 'None', 'Not Evaluated'] },
    { id: p + '_contact', label: 'Occupant Contact Evidence', type: 'multi', opts: ['None Observed', 'Makeup / Skin Transfer', 'Blood', 'Hair', 'Abrasion Marks', 'Other'], full: true },
    { id: p + '_notes', label: 'Comments', type: 'area', full: true },
  ];
}

function suspBlock(items) {
  return items.map(i => ({ id: i[0], label: i[1], type: i[2] || 'lr', opts: i[3], full: true }));
}

const SCHEMA = [
  {
    id: 'case', title: 'Case & Inspection', short: 'Case', always: true, fields: [
      { id: 'case', label: 'Case / Matter', type: 'text', full: true },
      { id: 'client', label: 'Client / Retaining Counsel', type: 'text' },
      { id: 'fileno', label: 'File No.', type: 'text' },
      { id: 'vi_date', label: 'VI Date', type: 'date' },
      { id: 'vi_loc', label: 'VI Location', type: 'text' },
      { id: 'vi_eng', label: 'VI Engineers', type: 'text', full: true },
      { id: 'attend', label: 'Other Attendees / Parties Present', type: 'area', full: true },
      { id: 'weather', label: 'Conditions (weather / lighting / indoors)', type: 'text', full: true },
    ]
  },
  {
    id: 'vehicle', title: 'Vehicle Information', short: 'Vehicle', fields: [
      { id: 'vin', label: 'VIN', type: 'vin', full: true },
      { id: 'year', label: 'Model Year', type: 'text' },
      { id: 'make', label: 'Make', type: 'text' },
      { id: 'model', label: 'Model', type: 'text' },
      { id: 'trim', label: 'Trim / Additional Model Codes', type: 'text' },
      { id: 'build', label: 'Build Date', type: 'text' },
      { id: 'body', label: 'Body Style', type: 'text' },
      { id: 'engine', label: 'Engine', type: 'text' },
      { id: 'trans', label: 'Transmission', type: 'select', opts: ['Automatic', 'Standard', 'CVT', 'EV Single-Speed'] },
      { id: 'drive', label: 'Drive Type', type: 'select', opts: ['FWD', 'RWD', '4WD', 'AWD'] },
      { id: 'doors', label: 'Door Configuration', type: 'text' },
      { id: 'gvwr', label: 'GVWR (lbs)', type: 'num' },
      { id: 'fgawr', label: 'FGAWR (lbs)', type: 'num' },
      { id: 'rgawr', label: 'RGAWR (lbs)', type: 'num' },
      { id: 'mileage', label: 'Mileage (odometer)', type: 'num' },
      { id: 'certtire', label: 'Tire Size & Pressure per Cert Sticker', type: 'text', full: true },
      { id: 'license', label: 'License Plate / State', type: 'text' },
      { id: 'insp_sticker', label: 'Inspection Sticker Date', type: 'text' },
      { id: 'reg', label: 'Registration Date', type: 'text' },
      { id: 'color', label: 'Exterior Color', type: 'text' },
      { id: 'opt', label: 'Optional Equipment', type: 'multi', full: true, opts: ['Side Airbags', 'Curtain Airbags', 'Knee Airbags', 'ABS', 'TCS', 'ESC', 'Power Steering', 'Tilt Steering', 'Power Brakes', 'Speed Control', 'Adaptive Cruise', 'Sunroof', 'Tow Package'] },
      { id: 'storage', label: 'Vehicle Storage Condition', type: 'area', full: true },
      { id: 'postcrash', label: 'Post-Crash Changes', type: 'area', full: true },
      { id: 'missing', label: 'Parts / Pieces Missing', type: 'area', full: true },
      { id: 'notes', label: 'Notes', type: 'area', full: true },
    ]
  },
  {
    id: 'signin', title: 'Sign-In', short: 'Sign-In', fields: [
      { id: 'list', label: 'Attendees', type: 'table', full: true, columns: [{ id: 'name', label: 'Name' }, { id: 'co', label: 'Company / Representing' }, { id: 'phone', label: 'Phone / Email' }] },
    ]
  },
  {
    id: 'exterior', title: 'Exterior & Damage', short: 'Exterior', fields: [
      { id: 'walk', label: 'Walk-Around Overview', type: 'area', full: true, hint: 'Overall damage description, PDOF, principal contact area' },
      { id: 'front', label: 'Front', type: 'area', full: true },
      { id: 'left', label: 'Left Side', type: 'area', full: true },
      { id: 'right', label: 'Right Side', type: 'area', full: true },
      { id: 'rear', label: 'Rear', type: 'area', full: true },
      { id: 'roof', label: 'Roof', type: 'area', full: true },
      { id: 'under', label: 'Undercarriage', type: 'area', full: true },
      { id: 'transfer', label: 'Paint / Material Transfer', type: 'area', full: true },
      { id: 'lamps', label: 'Lamps (filament / LED status)', type: 'area', full: true },
      { id: 'crush', label: 'Crush Measurements Taken', type: 'select', opts: ['Yes', 'No', 'Via 3D Scan'] },
      { id: 'notes', label: 'Notes', type: 'area', full: true },
    ]
  },
  {
    id: 'tires', title: 'Wheels & Tires', short: 'Tires', fields: [
      ...tireBlock('lf', 'Left Front'),
      ...tireBlock('rf', 'Right Front'),
      ...tireBlock('lr', 'Left Rear'),
      ...tireBlock('rr', 'Right Rear'),
      ...tireBlock('sp', 'Spare', true),
    ]
  },
  {
    id: 'glass', title: 'Glass & Engine Compartment', short: 'Glass/Engine', fields: [
      { id: 'g_hdr', type: 'heading', label: 'Vehicle Glass' },
      { id: 'g_ws', label: 'Windshield', type: 'status', opts: ['Intact', 'Broken Out', 'Cracked', 'Replaced'] },
      { id: 'g_drv', label: 'Driver', type: 'status', opts: INTACT },
      { id: 'g_rfp', label: 'RF Passenger', type: 'status', opts: INTACT },
      { id: 'g_lrp', label: 'LR Passenger', type: 'status', opts: INTACT },
      { id: 'g_rrp', label: 'RR Passenger', type: 'status', opts: INTACT },
      { id: 'g_lrc', label: 'LR Cargo', type: 'status', opts: INTACT },
      { id: 'g_rrc', label: 'RR Cargo', type: 'status', opts: INTACT },
      { id: 'g_rear', label: 'Rear', type: 'status', opts: INTACT },
      { id: 'g_lfm', label: 'LF Mirror', type: 'status', opts: ['Intact', 'Broken Off', 'N/A'] },
      { id: 'g_rfm', label: 'RF Mirror', type: 'status', opts: ['Intact', 'Broken Off', 'N/A'] },
      { id: 'g_sun', label: 'Sunroof', type: 'status', opts: INTACT },
      { id: 'g_frag', label: 'Fragment Locations', type: 'area', full: true },
      { id: 'e_hdr', type: 'heading', label: 'Engine Compartment' },
      { id: 'e_bfl', label: 'Brake Fluid Level', type: 'status', opts: STATUS_OPTS },
      { id: 'e_pedal', label: 'Brake Pedal Effort', type: 'status', opts: STATUS_OPTS },
      { id: 'e_mc', label: 'Master Cylinder', type: 'status', opts: STATUS_OPTS },
      { id: 'e_boost', label: 'Brake Booster', type: 'status', opts: STATUS_OPTS },
      { id: 'e_lines', label: 'Brake Lines', type: 'status', opts: STATUS_OPTS },
      { id: 'e_abs', label: 'ABS / TC / ESC Module', type: 'status', opts: STATUS_OPTS },
      { id: 'e_batt', label: 'Battery', type: 'status', opts: STATUS_OPTS },
      { id: 'e_battv', label: 'Battery Voltage (V)', type: 'num' },
      { id: 'e_cables', label: 'Battery Cables', type: 'status', opts: STATUS_OPTS },
      { id: 'e_ishaft', label: 'Intermediate Shaft', type: 'status', opts: STATUS_OPTS },
      { id: 'e_tb', label: 'Throttle Body', type: 'status', opts: STATUS_OPTS },
      { id: 'e_hv', label: 'HV Battery / Service Disconnect (EV/Hybrid)', type: 'status', opts: ['N/A', 'Connected', 'Disconnected', 'Not Evaluated'] },
      { id: 'e_notes', label: 'Notes', type: 'area', full: true },
    ]
  },
  {
    id: 'fsusp', title: 'Front Suspension', short: 'Front Susp', fields: [
      { id: 'hdr', type: 'heading', label: 'Front Suspension — Left / Right' },
      ...suspBlock([
        ['frame', 'Frame Rail'], ['axle', 'Front Axle / Half Shaft'], ['uca', 'Upper Control Arm'], ['lca', 'Lower Control Arm'],
        ['radius', 'Radius Arm'], ['tierod', 'Tie Rod'], ['steer', 'Pitman / Idler or Rack & Pinion'], ['spindle', 'Spindle'],
        ['bearing', 'Wheel Bearing'], ['btype', 'Brake Type', 'lrsel', ['Disc', 'Drum']], ['bcond', 'Brake Condition'], ['blines', 'Brake Lines'],
        ['wss', 'Wheel Speed Sensors'], ['shock', 'Shock / Strut'], ['stype', 'Spring Type', 'lrsel', ['Coil', 'T-Bar', 'Leaf', 'Air']], ['scond', 'Spring Condition'],
        ['jounce', 'Jounce Bumpers'], ['sbar', 'Stabilizer Bar'], ['sbush', 'Stabilizer Bar Bushings'], ['slinks', 'Stabilizer Bar Links'], ['marks', 'Marks in Wheel Well'],
      ]),
      { id: 'notes', label: 'Notes', type: 'area', full: true },
    ]
  },
  {
    id: 'rsusp', title: 'Rear Suspension', short: 'Rear Susp', fields: [
      { id: 'hdr', type: 'heading', label: 'Rear Suspension — Left / Right' },
      ...suspBlock([
        ['frame', 'Frame Rail'], ['axle', 'Rear Axle'], ['uca', 'Upper Control Arm'], ['lca', 'Lower Control Arm'],
        ['lat', 'Lateral Link'], ['trail', 'Trailing Link'], ['spindle', 'Spindle'], ['bearing', 'Wheel Bearing'],
        ['btype', 'Brake Type', 'lrsel', ['Disc', 'Drum']], ['bcond', 'Brake Condition'], ['blines', 'Brake Lines'], ['wss', 'Wheel Speed Sensors'],
        ['shock', 'Shock / Strut'], ['stype', 'Spring Type', 'lrsel', ['Coil', 'Leaf', 'Air']], ['scond', 'Spring Condition'],
        ['jounce', 'Jounce Bumpers'], ['sbar', 'Stabilizer Bar'], ['sbush', 'Stabilizer Bar Bushings'], ['slinks', 'Stabilizer Bar Links'], ['marks', 'Marks in Wheel Well'],
      ]),
      { id: 'pbrake', label: 'Parking Brake', type: 'status', opts: ['Functional', 'Applied', 'Not Applied', 'Not Evaluated'], full: true },
      { id: 'notes', label: 'Notes', type: 'area', full: true },
    ]
  },
  {
    id: 'brakes', title: 'Brake Measurements', short: 'Brakes', fields: [
      { id: 'fp_hdr', type: 'heading', label: 'Front Pads — Friction Material Only (inches)' },
      { id: 'fp_lf_in', label: 'LF Inner Pad', type: 'num' }, { id: 'fp_lf_out', label: 'LF Outer Pad', type: 'num' },
      { id: 'fp_lf_bp', label: 'LF Backing Plate', type: 'num' }, { id: 'fp_lf_rotor', label: 'LF Rotor Thickness', type: 'num' },
      { id: 'fp_rf_in', label: 'RF Inner Pad', type: 'num' }, { id: 'fp_rf_out', label: 'RF Outer Pad', type: 'num' },
      { id: 'fp_rf_bp', label: 'RF Backing Plate', type: 'num' }, { id: 'fp_rf_rotor', label: 'RF Rotor Thickness', type: 'num' },
      { id: 'fp_notes', label: 'Front Notes', type: 'area', full: true },
      { id: 'rp_hdr', type: 'heading', label: 'Rear Pads — Friction Material Only (inches)', na: true },
      { id: 'rp_lr_in', label: 'LR Inner Pad', type: 'num' }, { id: 'rp_lr_out', label: 'LR Outer Pad', type: 'num' },
      { id: 'rp_lr_bp', label: 'LR Backing Plate', type: 'num' }, { id: 'rp_lr_rotor', label: 'LR Rotor Thickness', type: 'num' },
      { id: 'rp_rr_in', label: 'RR Inner Pad', type: 'num' }, { id: 'rp_rr_out', label: 'RR Outer Pad', type: 'num' },
      { id: 'rp_rr_bp', label: 'RR Backing Plate', type: 'num' }, { id: 'rp_rr_rotor', label: 'RR Rotor Thickness', type: 'num' },
      { id: 'rp_notes', label: 'Rear Pad Notes', type: 'area', full: true },
      { id: 'rs_hdr', type: 'heading', label: 'Rear Shoes — Friction Material Only (inches)', na: true },
      { id: 'rs_lr_lead', label: 'LR Leading Shoe', type: 'num' }, { id: 'rs_lr_trail', label: 'LR Trailing Shoe', type: 'num' }, { id: 'rs_lr_drum', label: 'LR Drum Diameter', type: 'num' },
      { id: 'rs_rr_lead', label: 'RR Leading Shoe', type: 'num' }, { id: 'rs_rr_trail', label: 'RR Trailing Shoe', type: 'num' }, { id: 'rs_rr_drum', label: 'RR Drum Diameter', type: 'num' },
      { id: 'rs_notes', label: 'Rear Shoe Notes', type: 'area', full: true },
    ]
  },
  {
    id: 'interior', title: 'Interior', short: 'Interior', fields: [
      { id: 'f_hdr', type: 'heading', label: 'Front Row', na: true },
      { id: 'f_mirror', label: 'Rear View Mirror', type: 'status', opts: STATUS_OPTS },
      { id: 'f_seattype', label: 'Front Seat Type', type: 'select', opts: ['Bucket', 'Bench', 'Split Bench'] },
      { id: 'f_pillars', label: 'Pillars & Headliner', type: 'status', opts: STATUS_OPTS },
      { id: 'f_ip', label: 'Instrument Panel', type: 'status', opts: STATUS_OPTS },
      { id: 'f_console', label: 'Center Console', type: 'status', opts: STATUS_OPTS },
      { id: 'f_glove', label: 'Glove Box & Owner\'s Manual', type: 'status', opts: STATUS_OPTS },
      { id: 'f_doors', label: 'Door Panels', type: 'status', opts: STATUS_OPTS },
      { id: 'f_contact', label: 'Contact Marks', type: 'area', full: true },
      { id: 'f_sw', label: 'Steering Wheel', type: 'status', opts: STATUS_OPTS },
      { id: 'f_col', label: 'Steering Column & Shroud', type: 'status', opts: STATUS_OPTS },
      { id: 'f_shift', label: 'Shift Controls', type: 'select', opts: ['Floor', 'Steering Column', 'Dial / Button'] },
      { id: 'f_shiftpos', label: 'Shifter Position As Found', type: 'text' },
      { id: 'f_knee', label: 'Knee Bolster', type: 'status', opts: STATUS_OPTS },
      { id: 'f_pedals', label: 'Pedals (position / marks)', type: 'text', full: true },
      { id: 'ds_hdr', type: 'heading', label: 'Driver / Passenger Seats' },
      { id: 'seat', label: 'Seat (position / track)', type: 'lr', cols: ['Driver', 'Passenger'], full: true },
      { id: 'seatback', label: 'Seatback (angle / condition)', type: 'lr', cols: ['Driver', 'Passenger'], full: true },
      { id: 'headrest', label: 'Headrest', type: 'lr', cols: ['Driver', 'Passenger'], full: true },
      { id: 'r2_hdr', type: 'heading', label: 'Second Row', na: true },
      { id: 'r2_type', label: 'Seat Type', type: 'text' },
      { id: 'r2_doors', label: 'Door Panels', type: 'status', opts: STATUS_OPTS },
      { id: 'r2_pillars', label: 'Pillar & Headliner', type: 'status', opts: STATUS_OPTS },
      { id: 'r2_contact', label: 'Contact Marks', type: 'area', full: true },
      { id: 'r2_notes', label: 'Notes', type: 'area', full: true },
      { id: 'r3_hdr', type: 'heading', label: 'Third Row', na: true },
      { id: 'r3_type', label: 'Seat Type', type: 'text' },
      { id: 'r3_pillars', label: 'Pillar & Headliner', type: 'status', opts: STATUS_OPTS },
      { id: 'r3_contact', label: 'Contact Marks', type: 'area', full: true },
      { id: 'r3_notes', label: 'Notes', type: 'area', full: true },
      { id: 'c_hdr', type: 'heading', label: 'Cargo Area / Trunk / Bed' },
      { id: 'c_tail', label: 'Tailgate / Rear Door', type: 'status', opts: STATUS_OPTS },
      { id: 'c_pillars', label: 'Pillar & Headliner', type: 'status', opts: STATUS_OPTS },
      { id: 'c_contact', label: 'Contact Marks', type: 'area', full: true },
      { id: 'c_debris', label: 'Debris / Items', type: 'area', full: true },
      { id: 'c_notes', label: 'Notes', type: 'area', full: true },
    ]
  },
  {
    id: 'belts', title: 'Seatbelts', short: 'Seatbelts', fields: [
      ...beltBlock('d', 'Driver', { pt: true }),
      ...beltBlock('cf', 'Center Front', { center: true }),
      ...beltBlock('rf', 'Right Front', { pt: true }),
      ...beltBlock('lr', 'Left Rear', { pt: true }),
      ...beltBlock('cr', 'Center Rear', { center: true }),
      ...beltBlock('rr', 'Right Rear', { pt: true }),
      ...beltBlock('l3', 'Left Third Row'),
      ...beltBlock('c3', 'Center Third Row', { center: true }),
      ...beltBlock('r3', 'Right Third Row'),
      { id: 'child', label: 'Child Restraints / LATCH', type: 'area', full: true },
    ]
  },
  {
    id: 'srs', title: 'SRS / Airbags', short: 'SRS', fields: [
      { id: 'lamp', label: 'SRS Warning Lamp (key on)', type: 'select', opts: ['Off (normal)', 'On', 'Flashing', 'No Power', 'Not Evaluated'] },
      { id: 'sysdesc', label: 'System Description', type: 'area', full: true, hint: 'Airbag count/locations per build sheet, generation' },
      ...airbagBlock('df', 'Driver Frontal Airbag'),
      ...airbagBlock('pf', 'Passenger Frontal Airbag'),
      ...airbagBlock('dk', 'Driver Knee Airbag'),
      ...airbagBlock('pk', 'Passenger Knee Airbag'),
      ...airbagBlock('ds', 'Driver Side / Torso Airbag'),
      ...airbagBlock('ps', 'Passenger Side / Torso Airbag'),
      ...airbagBlock('lc', 'Left Curtain Airbag'),
      ...airbagBlock('rc', 'Right Curtain Airbag'),
      ...airbagBlock('oth', 'Other Airbag (center / rear / seat cushion)'),
      { id: 'acu_hdr', type: 'heading', label: 'Airbag Control Unit (ACU / SDM / RCM)' },
      { id: 'acu_loc', label: 'Location', type: 'text' },
      { id: 'acu_pn', label: 'Part Number', type: 'text' },
      { id: 'acu_mount', label: 'Mounting / Bracket Condition', type: 'status', opts: STATUS_OPTS },
      { id: 'acu_conn', label: 'Connector Condition', type: 'status', opts: STATUS_OPTS },
      { id: 'acu_power', label: 'Power / Ground at Connector', type: 'select', opts: ['Verified', 'Not Verified', 'No Power'] },
      { id: 'acu_orient', label: 'Orientation Arrow / Install Direction', type: 'text' },
      { id: 'acu_notes', label: 'Notes', type: 'area', full: true },
      { id: 'cs_hdr', type: 'heading', label: 'Crash / Satellite Sensors' },
      { id: 'cs_list', label: 'Sensors', type: 'table', full: true, columns: [{ id: 'type', label: 'Type' }, { id: 'loc', label: 'Location' }, { id: 'cond', label: 'Condition / Notes' }] },
      { id: 'ocs_hdr', type: 'heading', label: 'Occupant Classification / Seat Sensors' },
      { id: 'ocs_pass', label: 'Passenger OCS Type', type: 'select', opts: ['Weight Mat', 'Load Cells', 'Capacitive', 'None', 'Unknown'] },
      { id: 'ocs_lamp', label: 'PASS AIRBAG OFF Indicator', type: 'select', opts: ['Present', 'Not Present', 'Not Evaluated'] },
      { id: 'ocs_track', label: 'Seat Track Position Sensors', type: 'text' },
      { id: 'ocs_buckle', label: 'Buckle Switches', type: 'text' },
      { id: 'ocs_notes', label: 'Notes', type: 'area', full: true },
    ]
  },
  {
    id: 'adas', title: 'ADAS', short: 'ADAS', fields: [
      { id: 'eq', label: 'Systems Equipped (per build / window sticker / observation)', type: 'multi', full: true, opts: ['FCW', 'AEB', 'Pedestrian Detection', 'ACC', 'Stop & Go ACC', 'LDW', 'LKA', 'Lane Centering', 'BSM', 'RCTA', 'Rear AEB', 'Park Sensors', 'Rear Camera', 'Surround View', 'Auto High Beam', 'Traffic Sign Recognition', 'Driver Monitoring', 'Hands-Free Highway Assist', 'None'] },
      { id: 'src', label: 'Equipment Verified Via', type: 'multi', opts: ['Build Sheet', 'Window Sticker', 'Owner\'s Manual', 'Visual', 'Scan Tool', 'Infotainment Menu'], full: true },
      { id: 'lamp', label: 'ADAS Warning / Fault Lamps (key on)', type: 'area', full: true },
      { id: 'fr_hdr', type: 'heading', label: 'Front Radar', na: true },
      { id: 'fr_loc', label: 'Location', type: 'text' },
      { id: 'fr_pn', label: 'Part Number', type: 'text' },
      { id: 'fr_mount', label: 'Mounting / Bracket', type: 'status', opts: ['Unremarkable', 'Displaced', 'Damaged', 'Missing', 'Not Evaluated'] },
      { id: 'fr_cover', label: 'Fascia / Emblem Cover Condition', type: 'status', opts: STATUS_OPTS },
      { id: 'fr_aim', label: 'Aim / Alignment Evidence', type: 'text', full: true },
      { id: 'fc_hdr', type: 'heading', label: 'Forward Camera', na: true },
      { id: 'fc_loc', label: 'Location / Bracket', type: 'text' },
      { id: 'fc_pn', label: 'Part Number', type: 'text' },
      { id: 'fc_ws', label: 'Windshield Replaced / Aftermarket Glass', type: 'select', opts: ['No Evidence', 'Yes', 'Unknown'] },
      { id: 'fc_obstruct', label: 'Lens Obstruction / Damage', type: 'status', opts: STATUS_OPTS },
      { id: 'fc_cal', label: 'Calibration Evidence (sticker / target marks / service records)', type: 'text', full: true },
      { id: 'cr_hdr', type: 'heading', label: 'Corner / Side Radars, Ultrasonics, Side Cameras', na: true },
      { id: 'cr_list', label: 'Sensor Inventory', type: 'table', full: true, columns: [{ id: 'sensor', label: 'Sensor' }, { id: 'loc', label: 'Location' }, { id: 'cond', label: 'Condition' }, { id: 'pn', label: 'Part No.' }] },
      { id: 'set_hdr', type: 'heading', label: 'Settings As Found' },
      { id: 'set_state', label: 'System On/Off States', type: 'area', full: true, hint: 'e.g. AEB on, LKA off, FCW sensitivity Far' },
      { id: 'set_follow', label: 'ACC Following Distance Setting', type: 'text' },
      { id: 'set_fcw', label: 'FCW Timing / Sensitivity', type: 'text' },
      { id: 'set_src', label: 'Settings Read From', type: 'select', opts: ['Infotainment Menu', 'Cluster Menu', 'Scan Tool', 'Not Accessible'] },
      { id: 'data_hdr', type: 'heading', label: 'Data Sources' },
      { id: 'data_avail', label: 'Potential Data', type: 'multi', full: true, opts: ['EDR / ACM', 'ADAS Module Freeze Frame', 'Infotainment / Telematics', 'OEM Cloud / Connected Services', 'Dashcam', 'Fleet Camera', 'Key Fob / Phone Logs', 'None Identified'] },
      { id: 'data_notes', label: 'Data Notes', type: 'area', full: true },
      { id: 'notes', label: 'ADAS Notes', type: 'area', full: true },
    ]
  },
  {
    id: 'diag', title: 'Diagnostics & Electrical', short: 'Diagnostics', fields: [
      { id: 'tool', label: 'Scan Tool / Software Version', type: 'text', full: true },
      { id: 'power', label: 'Vehicle Power For Scan', type: 'select', opts: ['Vehicle Battery', 'External 12V Supply', 'Direct-to-Module', 'No Power Available'] },
      { id: 'batt', label: 'Battery Voltage at Scan (V)', type: 'num' },
      { id: 'mileage', label: 'Odometer per Scan', type: 'num' },
      { id: 'modules', label: 'Modules Responding', type: 'area', full: true },
      { id: 'dtc', label: 'DTCs', type: 'table', full: true, columns: [{ id: 'mod', label: 'Module' }, { id: 'code', label: 'DTC' }, { id: 'desc', label: 'Description' }, { id: 'stat', label: 'Status (current / history / ign cycles)' }] },
      { id: 'ff', label: 'Freeze Frame Data Noted', type: 'area', full: true },
      { id: 'net', label: 'Network / CAN Status', type: 'area', full: true },
      { id: 'lamps', label: 'MIL / Other Warning Lamps', type: 'text', full: true },
      { id: 'fuses', label: 'Fuses / Relays Checked', type: 'area', full: true },
      { id: 'files', label: 'Scan Report File Names', type: 'area', full: true },
      { id: 'notes', label: 'Notes', type: 'area', full: true },
    ]
  },
  {
    id: 'edr', title: 'EDR / CDR', short: 'EDR', fields: [
      { id: 'status', label: 'Event Data Recorder', type: 'select', full: true, opts: ['N/A (not supported)', 'Previously Imaged', 'Imaged at Inspection — DLC', 'Imaged at Inspection — Direct-to-Module', 'Not Imaged (module removed for later download)', 'Not Imaged'] },
      { id: 'tool', label: 'Tool / Software Version', type: 'text' },
      { id: 'cable', label: 'Cable / Adapter Used', type: 'text' },
      { id: 'by', label: 'Imaged By', type: 'text' },
      { id: 'date', label: 'Download Date', type: 'date' },
      { id: 'modloc', label: 'Module Location', type: 'text' },
      { id: 'modpn', label: 'Module Part Number', type: 'text' },
      { id: 'events', label: 'Events Recorded (count / type)', type: 'text', full: true },
      { id: 'ign', label: 'Ignition Cycles at Event / at Download', type: 'text' },
      { id: 'files', label: 'CDR File Name(s)', type: 'area', full: true },
      { id: 'chain', label: 'Chain of Custody / Module Retained By', type: 'text', full: true },
      { id: 'notes', label: 'Notes', type: 'area', full: true },
    ]
  },
  {
    id: 'scan3d', title: '3D Scan', short: '3D Scan', fields: [
      { id: 'scanner', label: 'Scanner', type: 'text' },
      { id: 'quality', label: 'Quality', type: 'text' },
      { id: 'res', label: 'Resolution', type: 'text' },
      { id: 'powder', label: 'Powder', type: 'yn' },
      { id: 'color', label: 'Color', type: 'yn' },
      { id: 'dataphotos', label: 'Data Photos', type: 'yn' },
      { id: 'files', label: 'File Names', type: 'area', full: true },
      { id: 'scans', label: 'Scan Numbers', type: 'table', full: true, columns: [{ id: 'area', label: 'Area' }, { id: 'nums', label: 'Scan Numbers' }], seed: ['Front Bumper Bar', 'Rear Bumper Bar', 'Roof', 'Engine', 'Interior', 'Under Carriage'] },
      { id: 'notes', label: 'Notes', type: 'area', full: true },
    ]
  },
  {
    id: 'scene', title: 'Scene Inspection', short: 'Scene', fields: [
      { id: 'date', label: 'SI Date', type: 'date' },
      { id: 'city', label: 'City / State', type: 'text' },
      { id: 'road', label: 'Roadway(s)', type: 'text', full: true },
      { id: 'station', label: 'Station 0+00 Reference', type: 'text', full: true },
      { id: 'scan', label: 'Scan', type: 'yn' },
      { id: 'drone', label: 'Drone', type: 'yn' },
      { id: 'video', label: 'Video', type: 'yn' },
      { id: 'notes', label: 'Scene Notes', type: 'area', full: true },
      { id: 'evidence', label: 'Physical Evidence (tire marks, gouges, debris, fluid)', type: 'area', full: true },
      { id: 'survey', label: 'Survey Data', type: 'table', full: true, columns: [{ id: 'pt', label: 'Point' }, { id: 'x', label: 'X' }, { id: 'y', label: 'Y' }, { id: 'z', label: 'Z' }, { id: 'code', label: 'Code' }, { id: 'note', label: 'Note' }] },
      { id: 'drone_notes', label: 'Drone Data', type: 'area', full: true },
      { id: 'scan_hdr', type: 'heading', label: 'Scene Scan Settings' },
      { id: 's_scanner', label: 'Scanner', type: 'text' },
      { id: 's_quality', label: 'Quality', type: 'text' },
      { id: 's_res', label: 'Resolution', type: 'text' },
      { id: 's_color', label: 'Color', type: 'yn' },
      { id: 's_files', label: 'File Names', type: 'area', full: true },
      { id: 's_notes', label: 'Scan Notes', type: 'area', full: true },
    ]
  },
  {
    id: 'notes', title: 'General Notes', short: 'Notes', fields: [
      { id: 'notes', label: 'Notes', type: 'area', full: true, rows: 14 },
      { id: 'followup', label: 'Follow-Up Items', type: 'area', full: true },
    ]
  },
];
