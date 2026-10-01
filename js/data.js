/* Sample campus records. No server or database is required. */
window.DLF = window.DLF || {};
DLF.data = (() => {
  const categories = ['Electronics', 'Books', 'ID Cards', 'Bags', 'Clothing', 'Accessories', 'Keys', 'Documents', 'Other'];
  const locations = ['Engineering Library', 'EIE Department', 'University Cafeteria', 'Computer Laboratory', 'Lecture Hall', 'Library', 'Student Center', 'Sports Complex', 'Main Auditorium'];
  const user = { id: 'demo-student', name: 'Nipuni Liyanage', registration: 'EG/2023/XXXX', email: 'student@eng.ruh.ac.lk' };
  const rows = [
    [1, 'Black Casio Calculator', 'lost', 'Electronics', 'Black', 'Engineering Library', '2026-09-28', 'Black Casio scientific calculator lost near the library study area. The slide cover has a small scratch.', 'Open', 'calculator', user.id],
    [2, 'Blue Water Bottle', 'found', 'Accessories', 'Blue', 'EIE Department', '2026-09-29', 'An insulated blue water bottle was left on a bench outside the department.', 'Open', 'bottle', 'student-2'],
    [3, 'Student ID Card', 'found', 'Documents', 'Blue', 'University Cafeteria', '2026-09-30', 'A student identification card was handed in after lunch. Describe the card to verify ownership.', 'Returned', 'id', user.id],
    [4, 'Black Backpack', 'lost', 'Bags', 'Black', 'Computer Laboratory', '2026-09-27', 'A black backpack containing lecture notes and a pencil case. Last seen at a computer workstation.', 'Open', 'backpack', user.id],
    [5, 'USB Flash Drive', 'found', 'Electronics', 'Silver', 'Lecture Hall', '2026-09-30', 'A silver USB flash drive was found under a front-row desk. Tell us its capacity and identifying marks.', 'Open', 'usb', 'student-3'],
    [6, 'Engineering Mathematics Book', 'lost', 'Books', 'Green', 'Library', '2026-09-26', 'A green engineering mathematics textbook with handwritten notes tucked inside.', 'Open', 'book', 'student-4'],
    [7, 'Casio Scientific Calculator', 'found', 'Electronics', 'Black', 'Engineering Library', '2026-09-29', 'Scientific calculator found near the library entrance. Please describe a distinguishing feature when claiming.', 'Open', 'calculator', 'student-2'],
    [8, 'Canvas Backpack', 'found', 'Bags', 'Black', 'Computer Laboratory', '2026-09-28', 'A black canvas backpack was left beside the computer laboratory entrance.', 'Open', 'backpack', 'student-5'],
    [9, 'Room Keys', 'lost', 'Keys', 'Silver', 'Student Center', '2026-09-30', 'Two silver keys on a round keyring. Lost somewhere near the student center.', 'Open', 'keys', 'student-6'],
    [10, 'Wireless Headphones', 'found', 'Electronics', 'White', 'Library', '2026-09-30', 'White over-ear headphones found in a quiet study room.', 'Open', 'headphones', 'student-3'],
    [11, 'Navy Hoodie', 'lost', 'Clothing', 'Blue', 'Sports Complex', '2026-09-29', 'A navy blue hoodie left in the seating area after practice.', 'Open', 'hoodie', 'student-7'],
    [12, 'Reading Glasses', 'found', 'Accessories', 'Brown', 'Main Auditorium', '2026-09-28', 'Brown framed reading glasses found after the afternoon lecture.', 'Open', 'glasses', 'student-5'],
    [13, 'Lab Notebook', 'lost', 'Books', 'Blue', 'EIE Department', '2026-09-30', 'A blue laboratory notebook with circuit diagrams and experiment results.', 'Open', 'book', 'student-8'],
    [14, 'University ID Card', 'found', 'ID Cards', 'Blue', 'Lecture Hall', '2026-09-29', 'A university ID card was found after the morning lecture. Personal details are kept private.', 'Open', 'id', 'student-6'],
    [15, 'Compact Umbrella', 'lost', 'Other', 'Blue', 'University Cafeteria', '2026-09-28', 'A small blue folding umbrella with a wooden handle.', 'Resolved', 'umbrella', 'student-9'],
    [16, 'House Keys', 'found', 'Keys', 'Silver', 'Student Center', '2026-09-30', 'A set of silver keys handed in at the student center reception.', 'Open', 'keys', 'student-2']
  ];
  const items = rows.map(([id, name, type, category, color, location, date, description, status, illustration, ownerId]) => ({ id, name, type, category, color, location, date, description, status, ownerId, image: `assets/images/${illustration}.svg` }));
  const notifications = [
    { id: 1, title: 'Possible Match Found!', message: 'A black calculator matching your lost item was reported near the Engineering Library.', date: '2026-09-30T10:35:00', read: false, icon: 'match', itemId: 7 },
    { id: 2, title: 'New Item Found', message: 'A University ID Card was reported at the Lecture Hall.', date: '2026-09-30T09:15:00', read: false, icon: 'found', itemId: 14 },
    { id: 3, title: 'Claim Accepted', message: 'Your sample claim for the Blue Water Bottle has been accepted.', date: '2026-09-29T14:20:00', read: false, icon: 'check', itemId: 2 },
    { id: 4, title: 'A happy reunion', message: 'The Student ID Card you reported was successfully returned. Thank you for helping!', date: '2026-09-29T11:00:00', read: true, icon: 'heart', itemId: 3 }
  ];
  return { categories, locations, user, items, notifications, matches: [{ id: 1, lostId: 1, foundId: 7 }, { id: 2, lostId: 4, foundId: 8 }] };
})();
