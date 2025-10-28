// Import images
import cochinita from "@/assets/menu/cochinita-pibil.jpg";
import birriaTaco from "@/assets/menu/birria-taco.jpg";
import alPastor from "@/assets/menu/al-pastor.jpg";
import lenguaTaco from "@/assets/menu/lengua-taco.jpg";
import carnitasTaco from "@/assets/menu/carnitas-taco.jpg";
import polloAsadoTaco from "@/assets/menu/pollo-asado-taco.jpg";
import birriaTostada from "@/assets/menu/birria-tostada.jpg";
import tingaTostada from "@/assets/menu/tinga-tostada.jpg";
import camaronesTostada from "@/assets/menu/camarones-tostada.jpg";
import tortaBirria from "@/assets/menu/torta-birria.jpg";
import tortaCubana from "@/assets/menu/torta-cubana.jpg";
import burritoBirria from "@/assets/menu/burrito-birria.jpg";
import pozole from "@/assets/menu/pozole.jpg";
import caldoCamaron from "@/assets/menu/caldo-camaron.jpg";
import molcajete from "@/assets/menu/molcajete.jpg";
import chilesRellenos from "@/assets/menu/chiles-rellenos.jpg";
import enchiladasRojas from "@/assets/menu/enchiladas-rojas.jpg";
import mojarraFrita from "@/assets/menu/mojarra-frita.jpg";
import molePoblano from "@/assets/menu/mole-poblano.jpg";
import camaronesDiabla from "@/assets/menu/camarones-diabla.jpg";
import arrachera from "@/assets/menu/arrachera.jpg";
import quesadilla from "@/assets/menu/quesadilla.jpg";
import nachos from "@/assets/menu/nachos.jpg";
import aguasFrescas from "@/assets/menu/aguas-frescas.jpg";
import jugoNaranja from "@/assets/menu/jugo-naranja.jpg";
import tresLeches from "@/assets/menu/tres-leches.jpg";
import flan from "@/assets/menu/flan.jpg";

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  image?: string;
}

export const menuCategories = [
  "Tacos",
  "Taquitos",
  "Tostadas",
  "Tortas",
  "Burritos",
  "Sopas",
  "Platillos Principales",
  "Antojitos",
  "Quesadillas",
  "Bebidas",
  "Postres"
];

export const menuItems: MenuItem[] = [
  // Tacos
  { id: "t1", name: "Cochinita Pibil", description: "Slow-roasted pork marinated in citrus and achiote, tender and aromatic", price: 4.00, category: "Tacos", image: cochinita },
  { id: "t2", name: "Birria", description: "Rich, slow-braised beef in savory chile broth, perfectly spiced", price: 3.00, category: "Tacos", image: birriaTaco },
  { id: "t3", name: "Al Pastor", description: "Juicy marinated pork with pineapple, grilled to perfection on the trompo", price: 3.00, category: "Tacos", image: alPastor },
  { id: "t4", name: "Tripa", description: "Crispy, golden-fried beef tripe with a satisfying crunch", price: 3.00, category: "Tacos" },
  { id: "t5", name: "Lengua", description: "Tender, melt-in-your-mouth beef tongue, seasoned to perfection", price: 5.00, category: "Tacos", image: lenguaTaco },
  { id: "t6", name: "Cabeza", description: "Succulent beef head meat, incredibly tender and flavorful", price: 4.00, category: "Tacos" },
  { id: "t7", name: "Carnitas", description: "Crispy-edged, melt-in-your-mouth fried pork, the ultimate comfort", price: 3.00, category: "Tacos", image: carnitasTaco },
  { id: "t8", name: "Suadero", description: "Tender beef brisket, slow-cooked until it falls apart", price: 3.00, category: "Tacos" },
  { id: "t9", name: "Enchilada", description: "Zesty, chile-marinated spicy pork with a kick", price: 3.00, category: "Tacos" },
  { id: "t10", name: "Longaniza", description: "Savory Mexican pork sausage with aromatic spices", price: 3.00, category: "Tacos" },
  { id: "t11", name: "Buche", description: "Tender pork stomach, crispy outside and soft inside", price: 3.00, category: "Tacos" },
  { id: "t12", name: "Bistec", description: "Grilled beef steak, seasoned simply to let the flavor shine", price: 3.00, category: "Tacos" },
  { id: "t13", name: "Cueritos", description: "Tangy pickled pork skin with a delightful texture", price: 3.00, category: "Tacos" },
  { id: "t14", name: "Pollo Asado", description: "Smoky grilled chicken with char-kissed perfection", price: 3.00, category: "Tacos", image: polloAsadoTaco },
  { id: "t15", name: "Picadillo de Res", description: "Hearty ground beef stew with potatoes and warm spices", price: 3.00, category: "Tacos" },
  { id: "t16", name: "Tacos Arabes", description: "Middle Eastern-inspired pork wrapped in flour tortilla", price: 3.00, category: "Tacos" },
  { id: "t17", name: "Cecina", description: "Thin-sliced salted beef, grilled to smoky perfection", price: 3.00, category: "Tacos" },
  { id: "t18", name: "Barbachera", description: "Traditional pit-barbecued meat, tender and aromatic", price: 3.00, category: "Tacos" },
  { id: "t19", name: "Carne Azada", description: "Flame-grilled steak with smoky char and bold flavor", price: 3.00, category: "Tacos" },
  { id: "t20", name: "Oreja", description: "Crispy pig ear with incredible texture and flavor", price: 3.00, category: "Tacos" },
  { id: "t21", name: "Chillo", description: "Fresh fish fillet, lightly seasoned and perfectly grilled", price: 4.00, category: "Tacos" },

  // Taquitos (Soft Tacos)
  { id: "tq1", name: "Al Pastor", description: "Juicy marinated pork with pineapple on soft tortilla", price: 2.00, category: "Taquitos" },
  { id: "tq2", name: "Carnitas", description: "Crispy-tender fried pork in a pillowy soft taco", price: 2.00, category: "Taquitos" },
  { id: "tq3", name: "Suadero", description: "Melt-in-your-mouth beef brisket, simply delicious", price: 2.00, category: "Taquitos" },
  { id: "tq4", name: "Enchilada", description: "Spicy, chile-rubbed pork with bold flavors", price: 2.00, category: "Taquitos" },
  { id: "tq5", name: "Longaniza", description: "Aromatic pork sausage with traditional seasonings", price: 2.00, category: "Taquitos" },
  { id: "tq6", name: "Buche", description: "Crispy-tender pork stomach, unique and delicious", price: 2.00, category: "Taquitos" },
  { id: "tq7", name: "Bistec", description: "Simply grilled beef steak, classic and satisfying", price: 2.00, category: "Taquitos" },
  { id: "tq8", name: "Cueritos", description: "Tangy pickled pork skin, refreshing and zesty", price: 2.00, category: "Taquitos" },
  { id: "tq9", name: "Pollo Asada", description: "Char-grilled chicken with smoky goodness", price: 2.00, category: "Taquitos" },
  { id: "tq10", name: "Cecina", description: "Thinly sliced salted beef, smoky and savory", price: 2.00, category: "Taquitos" },

  // Tostadas (Crispy Tortillas)
  { id: "ts1", name: "Birria", description: "Rich braised beef on crispy tortilla with fresh toppings", price: 3.50, category: "Tostadas", image: birriaTostada },
  { id: "ts2", name: "Al Pastor", description: "Marinated pork with pineapple on a crunchy base", price: 3.50, category: "Tostadas" },
  { id: "ts3", name: "Lengua", description: "Tender beef tongue with beans, lettuce, and cream", price: 5.00, category: "Tostadas" },
  { id: "ts4", name: "Cabeza", description: "Succulent beef head meat, layered with fresh ingredients", price: 4.50, category: "Tostadas" },
  { id: "ts5", name: "Carnitas", description: "Crispy pork with beans, lettuce, and tangy salsa", price: 3.50, category: "Tostadas" },
  { id: "ts6", name: "Suadero", description: "Tender beef brisket on crispy shell with all the fixings", price: 3.50, category: "Tostadas" },
  { id: "ts7", name: "Enchilada", description: "Spicy pork with cool toppings for perfect balance", price: 3.50, category: "Tostadas" },
  { id: "ts8", name: "Longaniza", description: "Savory sausage with fresh vegetables and cream", price: 3.50, category: "Tostadas" },
  { id: "ts9", name: "Bistec", description: "Grilled steak on crunchy tortilla, simple perfection", price: 3.50, category: "Tostadas" },
  { id: "ts10", name: "Pollo", description: "Shredded chicken with fresh toppings and zesty sauce", price: 3.50, category: "Tostadas" },
  { id: "ts11", name: "Tinga", description: "Smoky chipotle chicken in tomato sauce, absolutely addictive", price: 3.50, category: "Tostadas", image: tingaTostada },
  { id: "ts12", name: "Pata de Res", description: "Tender beef foot in rich gelatinous broth, comfort food", price: 4.50, category: "Tostadas" },
  { id: "ts13", name: "Picadillo de Res", description: "Hearty beef stew with potatoes on crispy base", price: 3.50, category: "Tostadas" },
  { id: "ts14", name: "Vegetariana", description: "Fresh beans, lettuce, tomato, cheese, and avocado", price: 3.50, category: "Tostadas" },
  { id: "ts15", name: "De Camarones", description: "Plump shrimp with citrus and fresh vegetables", price: 4.50, category: "Tostadas", image: camaronesTostada },
  { id: "ts16", name: "Cecina", description: "Smoky salted beef on crispy tortilla perfection", price: 3.50, category: "Tostadas" },
  { id: "ts17", name: "Arabe", description: "Middle Eastern-inspired pork with unique spices", price: 3.50, category: "Tostadas" },

  // Tortas (Mexican Sandwiches)
  { id: "to1", name: "Birria", description: "Rich braised beef on toasted telera roll with all the fixings", price: 9.00, category: "Tortas", image: tortaBirria },
  { id: "to2", name: "Milaneza de Res", description: "Crispy breaded beef cutlet with creamy avocado and beans", price: 9.00, category: "Tortas" },
  { id: "to3", name: "Milaneza de Pollo", description: "Golden breaded chicken breast, perfectly crispy and juicy", price: 9.00, category: "Tortas" },
  { id: "to4", name: "Pierna Adobada", description: "Marinated pork leg in adobo sauce, incredibly tender", price: 9.00, category: "Tortas" },
  { id: "to5", name: "Pollo Asado", description: "Smoky grilled chicken with mayo, beans, and fresh veggies", price: 9.00, category: "Tortas" },
  { id: "to6", name: "Chuleta / Haumada", description: "Crispy fried pork chop, hearty and satisfying", price: 9.00, category: "Tortas" },
  { id: "to7", name: "Jamon y Huevo", description: "Ham and fluffy scrambled eggs, breakfast perfection", price: 9.00, category: "Tortas" },
  { id: "to8", name: "Salchicha y Huevo", description: "Savory sausage with eggs on toasted roll", price: 9.00, category: "Tortas" },
  { id: "to9", name: "Chorizo con Huevo", description: "Spicy Mexican sausage with eggs and melted cheese", price: 9.00, category: "Tortas" },
  { id: "to10", name: "Cubana", description: "Loaded sandwich with multiple meats, cheese, and everything", price: 10.00, category: "Tortas", image: tortaCubana },
  { id: "to11", name: "Tinga", description: "Smoky chipotle chicken in tomato sauce, irresistible", price: 9.00, category: "Tortas" },
  { id: "to12", name: "Cecina", description: "Thin-sliced salted beef, grilled to smoky perfection", price: 9.00, category: "Tortas" },
  { id: "to13", name: "Arabe", description: "Middle Eastern-inspired spiced pork on soft roll", price: 9.00, category: "Tortas" },
  { id: "to14", name: "Carnitas", description: "Crispy-tender pork with beans and fresh toppings", price: 9.00, category: "Tortas" },
  { id: "to15", name: "Al Pastor", description: "Juicy pork with pineapple on toasted telera bread", price: 9.00, category: "Tortas" },

  // Burritos
  { id: "b1", name: "Birria", description: "Rich braised beef with rice, beans, and melted cheese", price: 11.00, category: "Burritos", image: burritoBirria },
  { id: "b2", name: "Pollo", description: "Tender chicken with rice, beans, and fresh salsa", price: 11.00, category: "Burritos" },
  { id: "b3", name: "Bistec Asado", description: "Grilled steak burrito packed with flavor", price: 11.00, category: "Burritos" },
  { id: "b4", name: "Carnitas", description: "Crispy pork with all the fixings in a warm tortilla", price: 11.00, category: "Burritos" },
  { id: "b5", name: "Chorizo", description: "Spicy Mexican sausage with eggs, beans, and cheese", price: 11.00, category: "Burritos" },
  { id: "b6", name: "Lengua", description: "Tender beef tongue with rice, beans, and cilantro", price: 14.00, category: "Burritos" },
  { id: "b7", name: "Al Pastor", description: "Marinated pork with pineapple, wrapped to perfection", price: 11.00, category: "Burritos" },
  { id: "b8", name: "Picadillo de Res", description: "Hearty ground beef stew with potatoes and spices", price: 11.00, category: "Burritos" },
  { id: "b9", name: "Vegetariano", description: "Fresh beans, rice, cheese, lettuce, and guacamole", price: 11.00, category: "Burritos" },
  { id: "b10", name: "Cecina", description: "Smoky salted beef with traditional accompaniments", price: 11.00, category: "Burritos" },
  { id: "b11", name: "Arabe", description: "Middle Eastern-style spiced pork burrito", price: 11.00, category: "Burritos" },
  { id: "b12", name: "Mole", description: "Rich chocolate-chile sauce with chicken, unforgettable", price: 12.00, category: "Burritos" },

  // Sopas (Soups)
  { id: "s1", name: "Pozole Chica", description: "Hearty hominy soup with tender pork in red chile broth", price: 7.00, category: "Sopas", image: pozole },
  { id: "s2", name: "Pozole Grande", description: "Large bowl of traditional hominy soup, pure comfort", price: 10.00, category: "Sopas" },
  { id: "s3", name: "Pancita Chica", description: "Savory beef tripe soup with aromatic spices", price: 7.00, category: "Sopas" },
  { id: "s4", name: "Pancita Grande", description: "Large bowl of traditional Mexican tripe soup", price: 10.00, category: "Sopas" },
  { id: "s5", name: "Caldo de Camaron", description: "Spicy shrimp soup with vegetables, bold and satisfying", price: 15.00, category: "Sopas", image: caldoCamaron },
  { id: "s6", name: "Birria de Res", description: "Rich beef consommé with tender meat, for dipping", price: 13.99, category: "Sopas" },

  // Platillos Principales (Main Dishes)
  { id: "p1", name: "Molcajete", description: "Sizzling volcanic stone bowl with grilled meats, nopales, and cheese", price: 29.00, category: "Platillos Principales", image: molcajete },
  { id: "p2", name: "Cochinita Pibil", description: "Slow-roasted Yucatan pork in citrus-achiote marinade with pickled onions", price: 18.00, category: "Platillos Principales" },
  { id: "p3", name: "Birria", description: "Traditional slow-braised beef in rich chile broth with tortillas", price: 13.99, category: "Platillos Principales" },
  { id: "p4", name: "Ricos Chiles Rellenos", description: "Poblano peppers stuffed with cheese, in savory tomato sauce", price: 15.00, category: "Platillos Principales", image: chilesRellenos },
  { id: "p5", name: "Chuleta de Puerco", description: "Juicy grilled pork chop with rice, beans, and salad", price: 14.00, category: "Platillos Principales" },
  { id: "p6", name: "Bistec Encebollado", description: "Tender steak smothered in caramelized onions", price: 13.99, category: "Platillos Principales" },
  { id: "p7", name: "Bistec a la Mexicana", description: "Steak sautéed with tomatoes, jalapeños, and onions", price: 13.99, category: "Platillos Principales" },
  { id: "p8", name: "Bistec de Pollo a la Mexicana", description: "Chicken breast with tomatoes, peppers, and bold spices", price: 13.99, category: "Platillos Principales" },
  { id: "p9", name: "Enchilada Poblanas", description: "Tortillas in rich mole poblano sauce with chicken", price: 14.00, category: "Platillos Principales" },
  { id: "p10", name: "Enchiladas Rojas", description: "Rolled tortillas in smoky red chile sauce with melted cheese", price: 14.00, category: "Platillos Principales", image: enchiladasRojas },
  { id: "p11", name: "Enchiladas Verdes", description: "Tortillas in tangy tomatillo sauce with cream and cheese", price: 14.00, category: "Platillos Principales" },
  { id: "p12", name: "Chilaquiles Rojos o Verdes con Cecina", description: "Crispy tortilla chips in salsa with salted beef and eggs", price: 14.00, category: "Platillos Principales" },
  { id: "p13", name: "Cecina", description: "Thin-sliced salted beef, grilled with nopales and fresh cheese", price: 14.00, category: "Platillos Principales" },
  { id: "p14", name: "Mojarra Frita", description: "Whole fried tilapia, crispy outside and tender inside", price: 14.99, category: "Platillos Principales", image: mojarraFrita },
  { id: "p15", name: "Coctel de Camarones", description: "Chilled shrimp cocktail in tangy tomato sauce with avocado", price: 14.99, category: "Platillos Principales" },
  { id: "p16", name: "Mole Poblano", description: "Chicken in rich chocolate-chile sauce, a Mexican classic", price: 14.99, category: "Platillos Principales", image: molePoblano },
  { id: "p17", name: "Pechuga Asada", description: "Perfectly grilled chicken breast with fresh sides", price: 14.00, category: "Platillos Principales" },
  { id: "p18", name: "Carne Azada", description: "Charred grilled steak with smoky flavor and tender texture", price: 14.00, category: "Platillos Principales" },
  { id: "p19", name: "Carne Enchilada", description: "Chile-marinated pork, grilled to spicy perfection", price: 14.00, category: "Platillos Principales" },
  { id: "p20", name: "Camarones a la Diabla", description: "Shrimp in fiery red chile sauce, not for the faint of heart", price: 14.99, category: "Platillos Principales", image: camaronesDiabla },
  { id: "p21", name: "Camarones al Mojo de Ajo", description: "Succulent shrimp in rich garlic butter sauce", price: 14.99, category: "Platillos Principales" },
  { id: "p22", name: "Camarones Empanizados", description: "Crispy breaded shrimp, golden and delicious", price: 14.99, category: "Platillos Principales" },
  { id: "p23", name: "Filete de Pescado Asado a la Plancha", description: "Grilled fish fillet, simply seasoned and perfectly cooked", price: 14.00, category: "Platillos Principales" },
  { id: "p24", name: "Arrachera", description: "Tender marinated skirt steak, grilled to juicy perfection", price: 18.00, category: "Platillos Principales", image: arrachera },
  { id: "p25", name: "Fajitas", description: "Sizzling peppers and onions with your choice of meat", price: 18.00, category: "Platillos Principales" },
  { id: "p26", name: "Alambre", description: "Grilled meat with bacon, peppers, onions, and melted cheese", price: 18.00, category: "Platillos Principales" },
  { id: "p27", name: "Parrilladas", description: "Mixed grill platter with assorted meats for sharing", price: 24.99, category: "Platillos Principales" },

  // Antojitos Mexicanos
  { id: "a1", name: "Especial Tacos Orientales", description: "Eastern-style tacos with unique spice blend", price: 3.00, category: "Antojitos" },
  { id: "a2", name: "Cemitas de Milaneza", description: "Pueblan sandwich with breaded meat and avocado", price: 9.00, category: "Antojitos" },
  { id: "a3", name: "Quesadillas Regular", description: "Melted cheese in handmade tortilla, simple perfection", price: 7.00, category: "Antojitos", image: quesadilla },
  { id: "a4", name: "Quesadillas Toda", description: "Loaded quesadilla with meat and all the toppings", price: 8.00, category: "Antojitos" },
  { id: "a5", name: "Sopas", description: "Thick corn tortilla with beans and toppings", price: 3.00, category: "Antojitos" },
  { id: "a6", name: "Haurache Grande", description: "Large oblong masa base with beans, meat, and salsa", price: 4.00, category: "Antojitos" },
  { id: "a7", name: "Nachos", description: "Crispy chips loaded with cheese, meat, and fresh toppings", price: 13.00, category: "Antojitos", image: nachos },
  { id: "a8", name: "Guacamole w. Chips", description: "Fresh avocado dip with lime and cilantro, addictive", price: 8.00, category: "Antojitos" },
  { id: "a9", name: "Tacos Dorados", description: "Crispy rolled tacos with lettuce, cream, and salsa", price: 9.00, category: "Antojitos" },
  { id: "a10", name: "Tacos Plazeros", description: "Specialty tacos with choice of meats and toppings", price: 12.00, category: "Antojitos" },
  { id: "a11", name: "Chalupas", description: "Fried masa topped with meat, salsa, and cheese", price: 12.00, category: "Antojitos" },
  { id: "a12", name: "French Fries / Chicken Nugget", description: "Classic crispy fries or golden chicken nuggets", price: 6.00, category: "Antojitos" },
  { id: "a13", name: "Fajitas Arabe", description: "Middle Eastern-style fajitas with aromatic spices", price: 12.00, category: "Antojitos" },

  // Extras
  { id: "e1", name: "Quesillo", description: "Oaxacan string cheese, creamy and mild", price: 1.00, category: "Antojitos" },
  { id: "e2", name: "Pico de Gallo", description: "Fresh chopped salsa with tomato, onion, and cilantro", price: 1.00, category: "Antojitos" },
  { id: "e3", name: "Guacamole", description: "Creamy avocado dip with lime and seasonings", price: 1.00, category: "Antojitos" },
  { id: "e4", name: "Nopales", description: "Grilled cactus paddles, tender and tangy", price: 1.00, category: "Antojitos" },
  { id: "e5", name: "Crema", description: "Mexican sour cream, rich and tangy", price: 1.00, category: "Antojitos" },

  // Bebidas (Drinks)
  { id: "d1", name: "Aguas Frescas Med", description: "Refreshing fruit water, naturally sweetened", price: 3.00, category: "Bebidas" },
  { id: "d2", name: "Aguas Frescas Gde", description: "Large refreshing fruit water in seasonal flavors", price: 4.00, category: "Bebidas", image: aguasFrescas },
  { id: "d3", name: "Licuados Chocomilk Reg", description: "Creamy chocolate milk smoothie, rich and satisfying", price: 4.99, category: "Bebidas" },
  { id: "d4", name: "Licuados Chocomilk Large", description: "Large chocolate smoothie, indulgent and delicious", price: 7.00, category: "Bebidas" },
  { id: "d5", name: "Licuados Mamey Reg", description: "Tropical mamey smoothie, creamy and exotic", price: 4.99, category: "Bebidas" },
  { id: "d6", name: "Licuados Mamey Large", description: "Large mamey smoothie, uniquely delicious", price: 7.00, category: "Bebidas" },
  { id: "d7", name: "Licuados Fresa Reg", description: "Fresh strawberry smoothie, sweet and refreshing", price: 4.99, category: "Bebidas" },
  { id: "d8", name: "Licuados Fresa Large", description: "Large strawberry smoothie, berry delicious", price: 7.00, category: "Bebidas" },
  { id: "d9", name: "Licuados Platano Reg", description: "Creamy banana smoothie, naturally sweet", price: 4.99, category: "Bebidas" },
  { id: "d10", name: "Licuados Platano Large", description: "Large banana smoothie, smooth and satisfying", price: 7.00, category: "Bebidas" },
  { id: "d11", name: "Licuados Mango Reg", description: "Tropical mango smoothie, vibrant and refreshing", price: 4.99, category: "Bebidas" },
  { id: "d12", name: "Licuados Mango Large", description: "Large mango smoothie, taste of the tropics", price: 7.00, category: "Bebidas" },
  { id: "d13", name: "Licuados Papaya Reg", description: "Smooth papaya smoothie, tropical and healthy", price: 4.99, category: "Bebidas" },
  { id: "d14", name: "Licuados Papaya Large", description: "Large papaya smoothie, refreshing and nutritious", price: 7.00, category: "Bebidas" },
  { id: "d15", name: "Jugo de Naranja", description: "Freshly squeezed orange juice, pure sunshine", price: 4.00, category: "Bebidas", image: jugoNaranja },
  { id: "d16", name: "Limonada", description: "Fresh-squeezed limeade, tart and refreshing", price: 4.00, category: "Bebidas" },
  { id: "d17", name: "Piña Colada", description: "Tropical pineapple-coconut blend, vacation in a glass", price: 8.00, category: "Bebidas" },
  { id: "d18", name: "Refrescos Mexicanos", description: "Authentic Mexican sodas in glass bottles", price: 3.00, category: "Bebidas" },
  { id: "d19", name: "Sodas del Pais", description: "Classic American soft drinks", price: 2.00, category: "Bebidas" },

  // Postres (Desserts)
  { id: "de1", name: "Pastel de Tres Leches", description: "Heavenly sponge cake soaked in three milks, incredibly moist", price: 5.00, category: "Postres", image: tresLeches },
  { id: "de2", name: "Gelatinas", description: "Colorful layered gelatin desserts, light and refreshing", price: 3.00, category: "Postres" },
  { id: "de3", name: "Flan Napolitano", description: "Silky caramel custard, smooth and decadent", price: 4.00, category: "Postres", image: flan },
  { id: "de4", name: "Cremitas", description: "Sweet cream desserts in assorted flavors", price: 3.00, category: "Postres" },
];
