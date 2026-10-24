// Refus du serveur (422) : un code stable dans errors[].meta.code (refus métier, ou
// validation d'un modèle), traduit ici.
const messages = {
  not_a_player: "Vous n'êtes pas joueur de ce salon.",
  not_your_turn: "Ce n'est pas à vous de jouer.",
  stale: 'La partie a avancé entre-temps.',
  room_not_waiting: 'Le salon a déjà ses deux joueurs.',
  already_in_room: 'Vous êtes déjà dans ce salon.',
  room_not_playing: "Le salon n'est pas en jeu.",
  room_closed: 'Le salon est fermé.',
  game_in_progress: "La partie n'est pas terminée.",
  not_playing: "La partie n'est pas en phase de jeu.",
  game_finished: 'La partie est terminée.',
  opponent_present: 'Votre adversaire est là.',
  illegal_move: 'Coup impossible : ce motif apparaîtrait deux fois.',
  imposed_color: 'Cette couleur est imposée.',
  not_drafting: 'La pioche est terminée.',
  card_taken: 'Cette carte est déjà prise.',
  hand_full: 'Ce jeu a déjà ses 8 cartes.',
  // Validations des modèles (pseudo…)
  blank: 'Ne peut pas être vide.',
  too_long: 'Trop long.',
};

// Une erreur spraypaint (model.errors[attribut]) : { code, message }.
export function describe(error) {
  const code = error.rawPayload?.meta?.code ?? error.code;
  return { code, message: messages[code] ?? error.message };
}

// Premier refus d'un modèle spraypaint après un save() refusé.
export function refusal(model) {
  const error = Object.values(model.errors ?? {})[0];
  return error ? describe(error) : null;
}

export class Refused extends Error {
  constructor({ code, message }) {
    super(message);
    this.code = code;
  }
}

// save() d'un modèle ; un refus devient une exception Refused.
export async function saveOrRefuse(model) {
  if (!(await model.save())) throw new Refused(refusal(model));
  return model;
}
