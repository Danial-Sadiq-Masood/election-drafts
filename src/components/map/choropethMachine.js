import * as d3 from "d3";
import { attrs, styles, contrast, partyScale, disputedSeats, disputedSeatsObj } from "../../utilities";

import { PTI_Data } from "./translatedGrids/ptiData";
import { data } from "./translatedGrids/form45data";

import elections2024ECP from './translatedGrids/updatedRes2024.json';

import { createMachine, createActor, fromPromise, assign } from 'xstate';

window.PTI_Data = PTI_Data;
window.PTI_Data_fixed = data;

const zoomedSeats = {
  "peshawar": [30, 31, 28],
  "isb": [45, 46, 47, 54, 55, 56],
  "sialkot": [45, 46, 47, 54, 55, 56],
  "gujranwala": [77, 79],
  "faisalabad": [100, 101, 102, 103],
  "lahore": [116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129],
  "quetta": [262, 263],
  "multan": [148, 149],
  "hyderabad": [217, 218, 219],
  "karachi": [231, 232, 233, 234, 235, 236, 237, 238, 239, 240, 241, 242, 243, 244, 245, 246, 247, 248, 249]
}

const zoomedSeatsProvincesMap = {
  "peshawar": "KP",
  "isb": "ICT",
  "sialkot": "Punjab",
  "gujranwala": "Punjab",
  "faisalabad": "Punjab",
  "lahore": "Punjab",
  "quetta": "Balochistan",
  "multan": "Punjab",
  "hyderabad": "Sindh",
  "karachi": "Sindh"
}

function getZoomedSeatWinningParty(votesKey) {
  return Object.keys(zoomedSeats).map(area => {
    const winners = zoomedSeats[area].map((d) => getWinner(elections2024ECP[d], votesKey))
    const winnerCount = winners.reduce((acc, d) => {
      acc[d.party] ??= 0;
      acc[d.party] += 1;
      return acc;
    }, {})
    const winningParty = Object.entries(winnerCount).reduce((acc, d) => {
      return acc[1] > d[1] ? acc : d;
    }, ['', Number.NEGATIVE_INFINITY])[0];
    return {
      party: winningParty,
      id: area,
      color: partyScale(winningParty),
    };
  })
}

function getZoomedSeatLosingParty(votesKey) {
  return Object.keys(zoomedSeats).map(area => {
    const winners = zoomedSeats[area].map((d) => getLoser(elections2024ECP[d], votesKey))
    const winnerCount = winners.reduce((acc, d) => {
      acc[d.party] ??= 0;
      acc[d.party] += 1;
      return acc;
    }, {})
    const winningParty = Object.entries(winnerCount).reduce((acc, d) => {
      return acc[1] > d[1] ? acc : d;
    }, ['', Number.NEGATIVE_INFINITY])[0];
    return {
      party: winningParty,
      id: area,
      color: partyScale(winningParty),
    };
  })
}

window.getZoomedSeatWinningParty = getZoomedSeatWinningParty;

//window.select = select;

function getWinner(d, key = 'votes') {
  return d.result.reduce((acc, e) => e[key] > acc[key] ? e : acc)
}

function getLoser(d, key = 'votes') {
  return d.result.reduce((acc, e) => e[key] < acc[key] ? e : acc)
}

const getWinColor = (d, key = 'votes') => {
  //d.result.sort((e,f) => f[key] - e[key]);
  /*return d.result.length === 0 ||
  (d.result[0] &&
    d.result[0][key] === 0 &&
    d.result[1] &&
    d.result[1][key] === 0)
    ? "#eeeeee"
    : partyScale.domain().includes(d.result[0].party)
    ? partyScale(d.result[0].party)
    : "#dddddd";*/
  if (d.result[0] &&
    d.result[0][key] === 0 &&
    d.result[1] &&
    d.result[1][key] === 0) {
    return "#eeeeee"
  }
  let winner = d.result.reduce((acc, e) => e[key] > acc[key] ? e : acc)
  return partyScale.domain().includes(winner.party)
    ? partyScale(winner.party)
    : "#dddddd";
  /*let colors = {
    'KP' : 'red',
    'Punjab' : 'yellow',
    'Sindh' : 'green',
    'Balochistan' : "blue",
    'ICT' : 'pink'
  }

  return colors[d.province]*/
}

window.getWinColor = getWinColor;

const disputedSeatOpacity = 0.25;

const mockAnimation =
  (timeout) => new Promise(res => {
    setTimeout(res, timeout)
  });

const zoomedSeatsAnim = (key) => {
  return new Promise(res => {
    getZoomedSeatWinningParty(key).forEach((d) => {
      d3.select(`#${d.id}`)
        .transition()
        .duration(200)
        .style('fill', d.color)
        .on('end', res);
    })
  })
}

const zoomedSeatsColor = (key) => {
  getZoomedSeatWinningParty(key).forEach((d) => {
    d3.select(`#${d.id}`)
      .style('fill', d.color)
  })
}

const initAnimation = () => {
  //zoomedSeatsAnim();
  zoomedSeatsColor('declaredVotes');

  d3.select('#svgmap')
    .selectChildren()
    .classed('static', true);

  return new Promise(res => {
    d3.select('#svgmap')
      .selectChildren()
      .transition()
      .duration(700)
      .transition()
      .duration(700)
      .delay((d, i) => Math.random() * (i / 250) * 200)
      .style('opacity', '1')
      .on("end", res);
  })
}

const flipAnimation = (key) => {
  return Promise.all([
    new Promise(res => {
      d3.selectAll('path[data-seat-num]')
        .transition()
        .duration(300)
        .delay((d, i) => Math.random() * (i / 250) * 10)
        .style('fill', (d) => getWinColor(d, key))
        .on("end", res);
    }),
    zoomedSeatsAnim(key)
  ])
}

const filterAnimation = (filterObj, key) => {
  return Promise.all(
    [
      new Promise(res => {
        d3.selectAll('path[data-seat-num]')
          .transition()
          .duration(250)
          .style("opacity", (d) => (filterConstit(d, filterObj, key) ? 1 : 0.2))
          .style("pointer-events", (d) =>
            filterConstit(d, filterObj, key) ? "auto" : "none",
          )
          .style('fill', (d) => getWinColor(d, key))
          .on("end", res);
      }),
      new Promise(res => {
        getZoomedSeatWinningParty(key).forEach((combinedRes) => {
          let opacity;
          const filterSeat = filterZoomedOutSeat(combinedRes.id, filterObj, key);
          opacity = filterSeat ? 1 : 0.2;
          console.log('filtering zoomeout seat')
          d3.select(`#${combinedRes.id}`)
            .transition()
            .duration(200)
            .style('opacity', opacity)
            .style('fill', combinedRes.color)
            .on('end', res);
        })
      })
    ]
  )
}

const removefilterAnimation = (key) => {
  return Promise.all(
    [
      new Promise(res => {
        d3.selectAll('path[data-seat-num]')
          .transition()
          .duration(250)
          .style("opacity", (d) => (1))
          .style("pointer-events", "auto")
          .on("end", res);
      }),
      new Promise(res => {
        getZoomedSeatWinningParty(key).forEach((d) => {
          d3.select(`#${d.id}`)
            .transition()
            .duration(200)
            .style('opacity', 1)
            .on('end', res);
        })
      })
    ]
  )
}

function filterZoomedOutSeat(id, filterObj, key) {
  const { winnerArr, runnerUpArr, disputedSeats, naSeatsArr, provincesArr } =
    filterObj;

    console.log('123');

  return [
    !naSeatsArr.length > 0 || zoomedSeats[id].filter(d => naSeatsArr.includes('NA-' + (d + 1))).length > 0,
    !provincesArr.length > 0 || provincesArr.includes(zoomedSeatsProvincesMap[id]),
    !winnerArr.length > 0 || winnerArr.includes(getZoomedSeatWinningParty(key).filter(d => d.id == id)[0].party),
    !runnerUpArr.length > 0 || runnerUpArr.includes(getZoomedSeatLosingParty(key).filter(d => d.id == id)[0].party),
    !disputedSeats.length > 0 || disputedSeatsObj[getZoomedSeatWinningParty(key).filter(d => d.id == id)[0].party]
  ]
    .every(d => d);

}

function filterConstit(entry, filterObj, key) {
  const { winnerArr, runnerUpArr, naSeatsArr, disputedSeats, marginArr, provincesArr } =
    filterObj;

  console.log(filterObj)

  return [
    !naSeatsArr.length > 0 || naSeatsArr.includes(entry.seat),
    !provincesArr.length > 0 || provincesArr.includes(entry.province),
    !winnerArr.length > 0 || winnerArr.includes(getWinner(entry, key).party),
    !runnerUpArr.length > 0 || runnerUpArr.includes(getLoser(entry, key).party),
    !disputedSeats.length > 0 || disputedSeatsObj[entry.seat]
  ]
  .every(d => d);

}

window.initAnimation = initAnimation;

const choroplethMapMachine = createMachine({
  id: 'choroplethMap',
  initial: 'animating',
  context: ({ input }) => ({
    filters: {},
    votesKey: 'declaredVotes'
    //d3Selection : input.selection,
    //filteredSelection : input.selection
  }),
  states: {
    'animating': {
      id: 'animating',
      initial: 'firstRender',
      states: {
        'firstRender': {
          invoke: {
            id: 'firstRenderAnimate',
            src: fromPromise(initAnimation),
            onDone: {
              target: '#interactive'
            }
          }
        },
        'dataKeyChange': {
          invoke: {
            id: 'dataKeyChange',
            input: ({ context: { votesKey } }) => votesKey,
            src: fromPromise(({ input }) => {
              return flipAnimation(input);
            }),
            onDone: {
              target: '#interactive.unfiltered'
            }
          }
        },
        'applyFilter': {
          invoke: {
            id: 'applyFilter',
            input: ({ context }) => context,
            src: fromPromise(({ input }) => {
              return filterAnimation(input.filters, input.votesKey);
            }),
            onDone: {
              target: '#interactive.filtered'
            }
          }
        },
        'removeFilter': {
          invoke: {
            id: 'removeFilter',
            input: ({ context: { filters } }) => filters,
            src: fromPromise(({ input }) => {
              return removefilterAnimation(input.votesKey);
            }),
            onDone: {
              target: '#interactive.unfiltered'
            }
          }
        }
      }
    },
    'interactive': {
      id: 'interactive',
      initial: 'unfiltered',
      on: {
        'applyFilters': {
          target: '#animating.applyFilter',
          actions: assign({
            filters: ({ event }) => event.filters,
            votesKey: ({ context }) => context.votesKey
          })
        },
        'removeFilters': {
          target: '#animating.removeFilter'
        }
      },
      states: {
        'filtered': {
          on: {
            'changeVotesKey': {
              target: '#animating.applyFilter',
              actions: [
                (data) => console.log(data),
                assign({
                  filters: ({ context }) => context.filters,
                  votesKey: ({ event }) => event.votesKey
                })]
            }
          }
        },
        'unfiltered': {
          on: {
            'changeVotesKey': {
              actions: assign({
                filters: ({ context }) => context.filters,
                votesKey: ({ event }) => event.votesKey
              }),
              target: '#animating.dataKeyChange'
            }
          }
        }
      }
    }
  },
})/*.provide({
  actions : {
    turnOn : ()=>{
      console.log('in On transition');
    }
  }
})*/

function getNewContext({ event, context }, newValsObj) {
  return assign({
    ...context,
    ...newValsObj
  })
}

window.choroplethMapMachine = choroplethMapMachine;

const actor = createActor(choroplethMapMachine);
//actor.start();

//window.actor = actor;

export { choroplethMapMachine, actor };