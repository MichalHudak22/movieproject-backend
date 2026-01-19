import leoProfanity from "leo-profanity";
import removeAccents from "remove-accents";

// --- Načítanie slovníka ---
leoProfanity.loadDictionary();

// --- Pridanie vlastného slovníka SK/CZ/EN/PL/DE/ES/IT ---
leoProfanity.add([
  // SK/CZ
  "kokot","kkt","kokotko","pica","piča","píča","chuj","kurva","jebat","jebem","dopice","mrdka","mrd",
  "sukat","kunda","jebnuty","jebnutý","sucker","fucker","fuck","fucking","shit","bitch","asshole",
  "dick","pussy","cunt","motherfucker","slut","whore","crap","bastard","prdel","curak",
  "debil","blbec","kreten","kretén","hovno","zmrd","picus","sracka","sračka","zasran","zasraný","zkurveny","zkurvený",
  "pico","kokotina","kundy","kokoti","pice","píče",
  // POĽSKO
  "kurwa","chuj","pierdole","jebac","pizda","skurwysyn","suka","cipa","dupa","gówno",
  // NEMECKO
  "scheiße","scheisse","ficken","arschloch","hurensohn","fotze","wichser","schlampe","penis",
  // ŠPANIELSKO
  "mierda","puta","coño","cono","cabron","gilipollas","joder","polla","pene","zorra",
  // TALIANSKO
  "cazzo","stronzo","vaffanculo","troia","merda","figa","puttana","culattone"
]);

// --- Middleware ---
export const profanityFilter = (req, res, next) => {
  let text = req.body.text || req.body.content || req.body.review || "";
  text = removeAccents(text.toLowerCase());

  // odstránenie všetkých nepísmen
  const cleanText = text.replace(/[^a-z0-9]+/g, "");

  // hľadanie nevhodného slova kdekoľvek v texte
  const found = leoProfanity.list().find(word => cleanText.includes(word));

  if (found) {
    return res.status(400).json({
      error: `Please be polite! Your review contains inappropriate language: "${found}"`
    });
  }

  next();
};

