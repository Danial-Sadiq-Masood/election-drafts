import { scaleOrdinal } from "d3";
import elections2024ECP from './components/map/translatedGrids/updatedRes2024.json';

window.ecp_data = elections2024ECP;

elections2024ECP.forEach(d => {
  //let declared = getWinner(d,'declaredVotes')
  d.result.forEach((e) => {
    e.voteDifference = Math.abs((e.declaredVotes - e.actualVotes)) / Math.max(e.declaredVotes, e.actualVotes);
    e.voteDifferenceAbs = Math.abs(e.declaredVotes - e.actualVotes);
  })
  d.voteDiff = d.result
    .reduce((acc,d) => acc + d.voteDifferenceAbs, 0);
  let totalvotes = d.result.reduce((acc,d) => acc + Math.max(d.actualVotes, d.declaredVotes),0)
  d.voteDiffProp = d.voteDiff / totalvotes;
})


export const disputedSeats = elections2024ECP.filter(d => {
  return (d.result[0].actualVotes !== d.result[0].declaredVotes)
      && (d.result[1].actualVotes !== d.result[1].declaredVotes);
})

export const disputedSeatsObj = disputedSeats.reduce((acc,d)=>{
  acc[d.seat] = d;
  return acc;
}, {})

export const partyVotes = elections2024ECP.reduce((acc,d)=>{
  const winningParty = getWinner(d.result);
  const losingParty = getLoser(d.result);

  acc[winningParty.party] ??= {};
  acc[losingParty.party] ??= {};

  acc[winningParty.party].actualVotes ??= 0;
  acc[losingParty.party].actualVotes ??= 0;

  acc[winningParty.party].declaredVotes ??= 0;
  acc[losingParty.party].declaredVotes ??= 0;

  acc[winningParty.party].actualVotes += winningParty.actualVotes;
  acc[losingParty.party].actualVotes += losingParty.actualVotes;

  acc[winningParty.party].declaredVotes += winningParty.declaredVotes;
  acc[losingParty.party].declaredVotes += losingParty.declaredVotes;

  return acc;
}, {})

window.partyVotes = partyVotes;

window.disputedSeats = disputedSeats;

elections2024ECP.forEach(d => {
  let officialWinner = getWinner(d.result, 'declaredVotes').declaredVotes;
  let officialRU = getLoser(d.result , 'declaredVotes').declaredVotes;
  let form45Winner = getWinner(d.result, 'actualVotes').actualVotes;
  let form45RU = getLoser(d.result , 'actualVotes').actualVotes;
  d.officialMargin = (officialWinner - officialRU)/ (officialWinner + officialRU);
  d.form45Margin = (form45Winner - form45RU)/ (form45RU + form45Winner);
})

let officialWinnersCount = elections2024ECP.reduce((acc,d)=>{
  let winner = getWinner(d.result, 'declaredVotes');
  acc[winner.party] ??= 0;
  acc[winner.party] += 1;
  return acc;
},{});

let form45WinnersCount = elections2024ECP.reduce((acc,d)=>{
  let winner = getWinner(d.result, 'actualVotes');
  acc[winner.party] ??= 0;
  acc[winner.party] += 1;
  return acc;
},{});

export const allWinningParties = Object.keys({...officialWinnersCount,...form45WinnersCount});
window.allWinningParties = allWinningParties;

elections2024ECP.forEach(d => {
  /*if(d.province === 'KP'){
    d.xGrid -= 0.8
    d.yGrid -= 0.8
  }
  if(d.province === 'Sindh'){
    d.xGrid += 0.2
    d.yGrid += 0.2
  }*/
})

export function getWinner(d, key = 'votes') {
  return d.reduce((acc, e) => e[key] > acc[key] ? e : acc)
}

window.getWinner = getWinner;

export function getLoser(d, key = 'votes') {
  return d.reduce((acc, e) => e[key] < acc[key] ? e : acc)
}

const size = {
  never: '20px',
  fold: '150px',
  mobileS: '320px',
  mobileM: '375px',
  mobileL: '425px',
  tablet: '768px',
  laptop: '1024px',
  laptopM: '1200px',
  laptopL: '1440px',
  desktop: '1600px',
  desktopL: '2560px'
}

export const device = {
  never: `(min-width: ${size.never})`,
  fold: `(min-width: ${size.fold})`,
  mobileS: `(min-width: ${size.mobileS})`,
  mobileM: `(min-width: ${size.mobileM})`,
  mobileL: `(min-width: ${size.mobileL})`,
  tablet: `(min-width: ${size.tablet})`,
  tabletH: `(min-height: ${size.tablet})`,
  laptop: `(min-width: ${size.laptop})`,
  laptopM: `(min-width: ${size.laptopM})`,
  laptopL: `(min-width: ${size.laptopL})`,
  desktop: `(min-width: ${size.desktop})`,
  desktopL: `(min-width: ${size.desktopL})`
};

export const applyClasses = (styles, classNames) => {
  let classList = "";
  classNames.forEach((el, i) => {
    const sep = i === 0 ? "" : " ";
    classList = classList + sep + styles[el];
  });
  return classList;
}

export const yearStates = {
  '2024': {
    parties: ['PTI-IND', 'PML-N', 'PPP', 'MQM', 'IND', 'IPP'],
    runnerups: ['PTI-IND', 'PML-N', 'PPP', 'MQM', 'IND', 'IPP'],
    regions: ['Punjab', 'Sindh', 'Balochistan', 'KP', 'ICT'],
    data: elections2024ECP
  }
}

export const disableTurnout = ['1977', '1985', '1988', '1990', '1993', '1997', '2002'];

//MAP UTILITIES BELOW.

const RED = 0.2126;
const GREEN = 0.7152;
const BLUE = 0.0722;
const GAMMA = 2.4;

function luminance(r, g, b) {
  var a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, GAMMA);
  });
  return a[0] * RED + a[1] * GREEN + a[2] * BLUE;
}

export function contrast(rgb1, rgb2) {
  var lum1 = luminance(...hexToRgbArr(rgb1));
  var lum2 = luminance(...hexToRgbArr(rgb2));
  var brightest = Math.max(lum1, lum2);
  var darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

function hexToRgbArr(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16),
    ]
    : null;
}

export function attrs(selection, attrsObj) {
  if (!attrsObj) return;

  const attrsList = Object.entries(attrsObj);
  attrsList.forEach(([attr, value]) => {
    selection.attr(attr, value);
  });

  return selection;
}

export function styles(selection, stylesObj) {
  if (!stylesObj) return;

  const stylesList = Object.entries(stylesObj);
  stylesList.forEach(([attr, value]) => {
    selection.style(attr, value); // error handling? how does d3 throw errors here
  });

  return selection;
};

export const partyColors = {
  "PML-Q": "#4CD0E0",
  "PPP": "#757575", 
  "PNA": "#66BB6A", 
  "IND": "#FBC02C", 
  "IJI": "#66BB6A", 
  "PDA": "#757575", 
  "MQM": "#B71C1C", 
  "PML-N": "#9C27B0", 
  "MMA": "#4DB6AC", 
  "PTI": "#2E7D32", 
  "AL": "#D81B60", 
  "PTI-IND": "#43A047",
  'JUI-F' : '#FF5722', 
  'MWM' : '#F06292', 
  'IPP' : '#BA68C8', 
  'PML-Z' : '#FF8A80', 
  'PML' : '#FF80AB', 
  'PNAP' : '#E040FB', 
  'BAP' : '#673AB7', 
  'BNP' : '#B388FF', 
  'NP' : '#EEFF41', 
  'PKMAP' : '#F57F17'
}

export const otherColor = "#dddddd";

export const partyScale = scaleOrdinal()
  .domain(
    Object.entries(partyColors).map(d => d[0])
  )
  .range(
    Object.entries(partyColors).map(d => d[1])
  );

export function calcTooltipPosition(x, y) {
  let left, right, bottom, top;

  if (y < window.innerHeight * 0.70) {
    top = `${y + 30}px`;
    bottom = 'unset';
  }
  else {
    bottom = `${window.innerHeight - y + 20}px`;
    top = 'unset';
  }

  left = `${x - 145}px`;

  if (x - 145 < 15) {
    left = `15px`;
  }
  else if (x + 145 > window.innerWidth) {
    left = 'unset';
    right = '25px';
  }

  return {
    top, right, bottom, left
  }
};

export function getElectionSummary(electionData, runnerup = 0, votesKey = 'votes') {
  const summary = {};
  electionData.forEach((result) => {



    if (result.result[runnerup]) {
      const winParty = result.result[runnerup].party;


      if (result.result.length === 1) {
        if (summary[winParty]) {
          summary[winParty]++;
        } else {
          summary[winParty] = 1;
        }
      }
      else {
        if (result.result[0][votesKey] === result.result[1][votesKey]) {
          if (summary[winParty]) {
            summary[winParty] += 0;
          } else {
            summary[winParty] = 0;
          }
        }
        else {
          if (summary[winParty]) {
            summary[winParty]++;
          } else {
            summary[winParty] = 1;
          }
        }
      }

    }

    result.result = result.result.slice(0, 2);
  });

  const partiesSorted = Object.entries(summary)
    .sort((a, b) => b[1] - a[1]);

  let returnValue = [];
  partiesSorted.forEach((entry, index) => {
    returnValue[index] = {
      party: entry[0],
      seats: entry[1],
      color: partyScale.domain().includes(entry[0]) ? partyScale(entry[0]) : "#dddddd"
    }
  });
  return returnValue;
};

export function getElectionSummaryTopBar(electionData, votesKey = 'votes') {
  let summary = electionData.reduce((acc, d) => {
    let winner = getWinner(d.result, votesKey);
    acc[winner.party] = acc[winner.party] ? acc[winner.party] + 1 : 1;
    return acc;
  }, {});

  const partiesSorted = Object.entries(summary)
    .sort((a, b) => b[1] - a[1]);

  return partiesSorted.map((entry, index) => {
    return {
      party: entry[0],
      seats: entry[1],
      color: partyScale.domain().includes(entry[0]) ? partyScale(entry[0]) : "#dddddd"
    }
  });
};

export const Dictionary = {
  IND: "Independent",
  MMA: "Muttahida Majlis-e-Amal",
  "PPP-S": "Pakistan People's Party (Sherpao)",
  "PML-Q": "Pakistan Muslim League (Q)",
  "PML-C": "Pakistan Muslim League (Council)",
  CML: "Conventional Muslim League",
  PPP: "Pakistan People's Party",
  "PML-N": "Pakistan Muslim League (Nawaz)",
  NA: "National Alliance",
  PTI: "Pakistan Tehrik-e-Insaf",
  "PML-J": "Pakistan Muslim League (Junejo)",
  PAT: "Pakistan Awami Tehreek",
  SPP: "Shia Political Party",
  "PML-Z": "Pakistan Muslim League (Zia)",
  "PML-F": "Pakistan Muslim League (Functional)",
  MQM: "Muttahida Qaumi Movement",
  "MQM-H": "Muttahida Qaumi Movement (Haqiqi)",
  PKMAP: "Pakhtunkhwa Milli Awami Party",
  JWP: "Jamhoori Watan Party",
  BNP: "Balochistan National Party",
  "BNP-A": "Balochistan National Party (Awami)",
  ANP: "Awami National Party",
  TI: "Tehrik-e-Istiqlal",
  PDP: "Pakistan Democratic Party",
  BNM: "Balochistan National Movement",
  "BNM-M": "Balochistan National Movement (Mengal)",
  "BNM-H": "Balochistan National Movement (Hayee)",
  "PPP-SB": "Pakistan People's Party (Shaheed Bhutto)",
  NPP: "National People's Party",
  "NPP-K": "National People's Party (Khar)",
  JUI: "Jamiat Ulema-e-Islam",
  "JUI-NI": "Jamiat Ulema-e-Islam + Nizam e Islam",
  "JUI-F": "Jamiat Ulema-e-Islam (Fazl)",
  "JUI-S": "Jamiat Ulema-e-Islam (Sami)",
  "JUI-N": "Jamiat Ulema-e-Islam (Noorani)",
  MIP: "Milli Ittehad Pakistan",
  IJM: "Islamic Jamhoori Mahaz",
  MDM: "Muttahida Deeni Mahaz",
  PKQP: "Pakhtunkhwa Qaumi Party",
  PIF: "Pakistan Islamic Front",
  NDA: "National Democratic Alliance",
  IJI: "Islami Jamhoori Ittehad",
  "JUI-D": "Jamiat Ulema-e-Islam (Darkhasti)",
  PAI: "Pakistan Awami Ittehad",
  BNA: "Balochistan National Alliance",
  "PML-MQ": "Pakistan Muslim League (MQ)",
  PNP: "Pakistan National Party",
  PMAI: "Pakistan Milli Awami Ittehad",
  PDA: "People's Democratic Alliance",
  "JUP-N": "Jamiat Ulema-e-Pakistan (Noorani)",
  SNF: "Sindh National Front",
  SNA: "Sindh National Alliance",
  "AT-PG": "Awami Tehreek (Paleejo Group)",
  PNA: "Pakistan National Alliance",
  PNAP: "Pakistan Pakhtunkhwa National Awami Party",
  NP: "National Party",
  SUP: "Sindh United Party",
  AML: "Awami Muslim League",
  PCM: "Pakistan Citizen's Movement",
  "QWP-S": "Qaumi Watan Party (Sherpao)",
  AJI: "Awami Jamhoori Ittehad",
  APML: "All Pakistan Muslim League",
  JI: "Jamat e Islami",
  BNAP: "Bahawalpur National Awami Party",
  STP: "Sindh Taraqi Passand Party",
  BAP: "Balochistan Awami Party",
  GDA: "Grand Democratic Alliance",
  TLP: "Tehreek-e-Labbaik Pakistan",
  PAR: "Pakistan Awami Raj",
  PRP: "Pakistan Rah-e-haq Party",
  "NAP-W": "National Awami Party (Wali)",
  "NAP-B": "National Awami Party (Bhashani)",
  MJUP: "Markazi Jamiat Ulema-e-Pakistan",
  AL: "Awami League",
  PNL: "Pakistan National League",
  MJAH: "Markazi Jamiat-e-Ahle-Hadees",
  JGMD: "Jatiya Gana Mukti Dal",
  IGD: "Islami Gonotontri Dal",
  IPP: "Istehkam-e-Pakistan Party",
  "PTI-IND": "Independent (PTI Backed)",
};
