import translate from 'translate';
// import * as api from '../../api/index.jsx';
translate.engine = 'deepl';
translate.key = 'a6353ea4-0481-de0d-39d9-46e8254a53ce';
import User from "../models/user.js"

// Create a flashcard
const translateCards = async (terms) => {
  const cards = [];

  for (let i = 0; i < terms.length; i++) {
    const translation = await translate(terms[i], { from: 'it', to: 'en' });
    const card = { index: i+1, original: terms[i], translation: translation};
    cards.push(card);
  }

  return cards;
};

const translateText = async (text) => {
  const translation = await translate(text, { from: 'it', to: 'en' });
  return translation;
};

const processLemmas = async (lemmas) => {
  for (let i = 0; i < lemmas.length; i++) {
    if (!lemmas[i].translation) {
      const lemmaTranslation = await translate(lemmas[i].original, {from: 'it', to: 'en'});
      lemmas[i].translation = lemmaTranslation;
    };
    
    for (let j = 0; j < lemmas[i].sentences.length; j++) {
      const currentSentence = lemmas[i].sentences[j];
      if (!currentSentence.translation) {
        const sentTranslation = await translate(currentSentence.original, {from: 'it', to: 'en'});
        currentSentence.translation = sentTranslation;
        currentSentence.original = chopSentence(currentSentence.original, currentSentence.offsetBegin, currentSentence.offsetEnd);
      }
    };
  };
};

const chopSentence = (sentence, start, end) => {
  let s1 = sentence.slice(0, start);
  let s2 = sentence.slice(start, end);
  let s3 = sentence.slice(end, sentence.length);

  return ([s1, s2, s3]);
}

const createVerbHelper = (token1, token2) => {
  let helper = [];
  let compoundForm = 'unknown';

  if (token1.features.VerbForm[0] == 'Fin') {
    const tense = token1.features.Tense[0];
    const mood = token1.features.Mood[0];

    switch (mood) {
      case ('Ind'):              
        if (tense == 'Pres') {
          compoundForm = "Passato Prossimo";
        } else if (tense == 'Past') {
          compoundForm = "Trapassato Remoto";
        } else if (tense == 'Imp') {
          compoundForm = "Trapassato Prossimo";
        } else if (tense == 'Fut') {
          compoundForm = "Futuro Anteriore";
        };
        break;
      case ('Sub'):
        if (tense == 'Pres') {
          compoundForm = "Congiuntivo Passato";
        } else if (tense == 'Imp') {
          compoundForm = "Congiuntivo Trapassato";
        };
        break;
      case ('Cnd'):
        if (tense == 'Pres') {
          compoundForm = "Condizionale Passato";
        };
        break;
    }

    helper = [compoundForm, token1.features.Person[0], token1.features.Number[0]]
  } else if (token1.features.VerbForm[0] == 'Ger') {
    helper = ["GERUNDIO"]
  }

  // return helper + " " + token2.lemma;
  helper.push(token2.lemma)
  return helper;
};

const addVerbHelpers = (sentences) => {
  sentences.forEach((sentence) => {
    sentence.verbs.forEach((verb) => {
      sentence.tokens[verb.tokens[0] - 1].helper = true;
      if (verb.tokens.length == 2) {          
        if (sentence.tokens[verb.tokens[0] - 1].pos == 'VA') {
          const auxiliary = sentence.tokens[verb.tokens[0] - 1];            
          const participle = sentence.tokens[verb.tokens[1] - 1];
          auxiliary.helper = createVerbHelper(auxiliary, participle);
          auxiliary.helper.push('AUX');
          participle.helper = createVerbHelper(auxiliary, participle);
          participle.helper.push('PART');
        }      
      } else {
        const infinitive = sentence.tokens[verb.tokens[0] - 1];
        if (infinitive.isMultiwordToken) {
          const pronoun = sentence.tokens[verb.tokens[0]];    
          infinitive.helper = [infinitive.lemma, pronoun.lemma];    
        } else {                      
          const mood = infinitive.features.Mood ? infinitive.features.Mood[0] : null;
          const tense = infinitive.features.Tense ? infinitive.features.Tense[0] : null;
          const person = infinitive.features.Person ? infinitive.features.Person[0] : null;
          const number = infinitive.features.Number ? infinitive.features.Number[0] : null;
          infinitive.helper = [mood, tense, person, infinitive.lemma, number]
        }          
      }
    })
  })
}

const assignColor = (pos) => {
  // handle pos
  if (pos == 'S') {
    return "bg-bittersweet-200";        
  } else if (pos == 'E') {
    return "bg-sunglow-200";
  } else if (pos == 'A' || pos == 'AP') {
    return "bg-tropicalindigo-200";
  } else if (pos == 'V' || pos == 'VA') {
    return "bg-skyblue-200";
  } else {
    return null;
  }
}

const preprocessData = async (sentences, text, userData) => {
  const prepositionTerms = [];
  const nounTerms = [];
  const adjectiveTerms = [];
  const infinitiveTerms = [];
  const textList = [];
  const translatedSentences = [];

  await sentences.forEach(async (sentence) => {
    const translatedSentence = await translate(sentence.text, {from: 'it', to: 'en'});
    translatedSentences.push(translatedSentence);
  })

  // const { data } = await api.getLemmas(userData.id);

  // from getLemmas
  const user = await User.findOne({ _id: userData.id });
  const lemmasArray = user.lemmas;

  let lemmaArray = lemmasArray;

  sentences.forEach((sentence) => {
    let prepCheck = false;
    let prepCard = [];
    let offset = 0;
    sentence.tokens.forEach(async (token) => {
      token.color = assignColor(token.pos);

      if (token.index == 1)
        offset = token.characterOffsetBegin;
      
      // Handle lemmas
      if (['S', 'E', 'A', 'AP', 'V', 'VA'].includes(token.pos)) {
        let found = null;
        if (lemmaArray.length > 0)
          found = lemmaArray.find(element => element.original && element.original == token.lemma);

        const sentenceObj = {
          original: sentence.text, 
          translation: null, 
          word: token.originalText,
          offsetBegin: token.characterOffsetBegin - offset,
          offsetEnd: token.characterOffsetEnd - offset,
        };
        
        if (found) {
          console.log("Found sentence: ", found.sentences[0].original);
          const containsSentence = found.sentences.some(obj => (obj.original === sentence.text))          
          if (!containsSentence) {
            found.sentences.push(sentenceObj)
          }
        } else {
          lemmaArray.push({
            original: token.lemma, 
            translation: null, 
            pos: token.pos, 
            sentences: [sentenceObj],
          });
        }
      }

      // handle prepositions
      if (token.pos == 'E') {
        prepCheck = true;
      }

      // Add the helper field for verbs
      token.helper = [];

      // Add infinitives
      if (token.ud_pos == 'VERB' && !infinitiveTerms.includes(token.lemma)) {
        infinitiveTerms.push(token.lemma);
      }

      // Add each element
      if (textList.length == 0 || textList[textList.length-1] != token.originalText)
        textList.push(token.originalText);

      // Add preposition
      if (prepCheck) {
        if (token.isMultiwordToken) {
          if (token.isMultiwordFirstToken) {
              prepCard.push(token.originalText);
          }
        } else {
          prepCard.push(token.originalText);                        
        }

        if (token.pos == 'S' || token.pos == 'SP' || token.pos == 'V') {
          prepCheck = false;
          let prepTerm = "";
          prepCard.forEach((e) => {
            prepTerm = prepTerm + e + " "
          })
          prepositionTerms.push(prepTerm);
          prepCard = [];
        }                        
      }

      // Add noun
      if (token.pos == 'S' && !nounTerms.includes(token.originalText)) {            
        nounTerms.push(token.originalText);
      }

      // Add adjective
      if (token.pos == 'A' && !adjectiveTerms.includes(token.originalText)) {
        adjectiveTerms.push(token.originalText);
      }
    })
  })

  addVerbHelpers(sentences);

  const prepositionCards = await translateCards(prepositionTerms);
  const nounCards = await translateCards(nounTerms);
  const adjectiveCards = await translateCards(adjectiveTerms);
  const infinitiveCards = await translateCards(infinitiveTerms);
  const translatedText = await translateText(text);
  await processLemmas(lemmaArray);
  
  return {
    cards: {
      prepositions: prepositionCards,
      nouns: nounCards,
      adjectives: adjectiveCards,
      infinitives: infinitiveCards,
    },
    textList: textList,
    verbList: infinitiveTerms,
    translatedText: translatedText,
    lemmaArray: lemmaArray,
  }    
}

export default preprocessData;
