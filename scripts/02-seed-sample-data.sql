USE stranke_db;

-- Dodaj nekaj vzorčnih podatkov za testiranje
INSERT INTO Stranka (Stranka, Naslov, Kraj_postna_st, email, ID_DDV, VLG, Provizija) VALUES
('Podjetje ABC d.o.o.', 'Glavna cesta 123', '1000 Ljubljana', 'info@abc.si', 'SI12345678', 1500.00, 150.00),
('XYZ Storitve s.p.', 'Tržaška 45', '2000 Maribor', 'kontakt@xyz.si', 'SI87654321', 2300.00, 230.00),
('Trgovina DEF d.d.', 'Slovenska 67', '3000 Celje', 'prodaja@def.si', 'SI11223344', 890.00, 89.00);
