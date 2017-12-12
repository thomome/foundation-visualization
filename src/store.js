import Vue from 'vue'
import Vuex from 'vuex'
import Papa from 'papaparse'

import { intersect, setHashParams, getHashParams, ajax } from './util.js'
import { eventHub } from './eventHub.js'

Vue.use(Vuex)

export const store = new Vuex.Store({
  state: {
    language: {
      selected: 'de',
      terms: {}
    },
    scope1: { list: [], data: {}, selected: [], available: [] },
    scope2: { list: [], data: {}, selected: [], available: [] },
    grant: { list: [], data: {}, selected: [], available: [] },
    recipient: { list: [], data: {}, selected: [], available: [] },
    innochain: { list: [], data: {}, selected: [], available: [] },
    educhain: { list: [], data: {}, selected: [], available: [] },
    region: { list: [], data: {}, selected: [], available: [] },
    foundation: { list: [], data: {}, selected: [] },
    bounds: {
      ne: [47.933243004813725, 10.575639903386495],
      sw: [45.639066961601685, 5.883893951813307]
    },
    cacheDuration: (1000*60*60*24*3) // 3 days
  },
  mutations: {
    setLanguage(state, data) {
      Vue.set(state.language, 'selected', data.data)
      this.dispatch('loadLanguage')
    },
    setLanguageTerms(state, data){
      Vue.set(state.language, 'terms', data.data)
    },
    setBounds(state, data){
      Vue.set(state, 'bounds', data)
    },
    setData(state, data){
      for(let d in data.data){
        const r = data.data[d]
        Vue.set(state[data.list].data, r.id, r)
        state[data.list].list.push(r.id)
      }
    },

    setSelected(state, data){
      setHashParams(data.list, data.data)
      Vue.set(state[data.list], 'selected', data.data)
    }
  },
  getters: {
    term({language}){
      return (key, params) => {
        const term = language.terms[key]
        return term ? term : key;
      }
    },
    scopes1(state){
      return state.scope1.available.map(id => {
        const scope1 = state.scope1.data[id]
        scope1.name = scope1[state.language.selected]
        return scope1
      })
    },
    scopes2(state){
      return state.scope2.available.map(id => {
        const scope2 = state.scope2.data[id]
        scope2.name = scope2[state.language.selected]
        return scope2
      })
    },
    grants(state){
      return state.grant.available.map(id => {
        const grant = state.grant.data[id]
        grant.name = grant[state.language.selected]
        return grant
      })
    },
    recipients(state){
      return state.recipient.available.map(id => {
        const recipient = state.recipient.data[id]
        recipient.name = recipient[state.language.selected]
        return recipient
      })
    },
    innochains(state){
      return state.innochain.available.map(id => {
        const innochain = state.innochain.data[id]
        innochain.name = innochain[state.language.selected]
        return innochain
      })
    },
    educhains(state){
      return state.educhain.available.map(id => {
        const educhain = state.educhain.data[id]
        educhain.name = educhain[state.language.selected]
        return educhain
      })
    },
    regions(state){
      return state.region.available.map(id => {
        const region = state.region.data[id]
        region.name = region[state.language.selected]
        return region
      })
    },
    foundations(state){
      return state.foundation.available.map(id => {
        const foundation = state.foundation.data[id]
        foundation.name = foundation[state.language.selected]
        return foundation
      })
    },

    foundationById(state, getters){
      return (id) => {
        const foundation = state.foundation.data[id]

        foundation.region = state.region.data[foundation.regionId].name
        foundation.recipients = foundation.recipientIds.map(recipient_id => state.recipient.data[recipient_id])
        foundation.grants = foundation.grantIds.map(grant_id => state.grant.data[grant_id])
        foundation.scopes1 = foundation.scope1Ids.map(scope1_id => state.scope1.data[scope1_id])
        foundation.scopes2 = foundation.scope2Ids.map(scope2_id => state.scope2.data[scope2_id])
        foundation.innochains = foundation.innochainIds.map(innochain_id => state.innochain.data[innochain_id])
        foundation.educhains = foundation.educhainIds.map(educhain_id => state.educhain.data[educhain_id])

        return foundation
      }
    },

    allFoundations(state, getters) {
      const lang = state.language.terms
      const foundations = state.foundation.list.map(id => getters.foundationById(id))
      return foundations;
    },

    foundations(state, getters) {
      const allF = getters.allFoundations
      const slcR = state.recipient.selected
      const slcG = state.grant.selected
      const slcS1 = state.scope1.selected
      const slcS2 = state.scope2.selected
      const slcI = state.innochain.selected
      const slcE = state.educhain.selected

      let foundations = []
      let recipients = []
      const tempR = {}
      let grants = []
      const tempG = {}
      let scopes1 = []
      const tempS1 = {}
      let scopes2 = []
      const tempS2 = {}
      let innochains = []
      const tempI = {}
      let educhains = []
      const tempE =  {}

      if(slcR.length === 0 && slcG.length === 0 && slcS1.length === 0 && slcS2.length === 0 && slcI.length === 0 && slcE.length === 0){
        foundations = allF
        recipients = state.recipient.list
        grants = state.grant.list
        scopes1 = state.scope1.list
        scopes2 = state.scope2.list
        innochains = state.innochain.list
        educhains = state.educhain.list
      } else {

        allF.forEach((v) => {
          const checkRecipient = (slcR.length === 0 || intersect(slcR, v.recipientIds).length > 0)
          const checkGrant = (slcG.length === 0 || intersect(slcG, v.grantIds).length > 0)
          const checkScope1 = (slcS1.length === 0 || intersect(slcS1, v.scope1Ids).length > 0)
          const checkScope2 = (slcS2.length === 0 || intersect(slcS2, v.scope2Ids).length > 0)
          const checkInnochain = (slcI.length === 0 || intersect(slcI, v.innochainIds).length > 0)
          const checkEduchain = (slcE.length === 0 || intersect(slcE, v.educhainIds).length > 0)

          if(checkRecipient && checkGrant && checkScope1 && checkScope2 && checkInnochain && checkEduchain){
            foundations.push(v)
          }

          if(checkGrant && checkScope1 && checkScope2 && checkInnochain && checkEduchain){
            v.recipientIds.forEach(id => {
              if(!tempR[id]){
                tempR[id] = true
                recipients.push(id)
              }
            })
          }

          if(checkRecipient && checkScope1 && checkScope2 && checkInnochain && checkEduchain){
            v.grantIds.forEach(id => {
              if(!tempG[id]){
                tempG[id] = true
                grants.push(id)
              }
            })
          }

          if(checkRecipient && checkGrant && checkScope2 && checkInnochain && checkEduchain){
            v.scope1Ids.forEach(id => {
              if(!tempS1[id]){
                tempS1[id] = true
                scopes1.push(id)
              }
            })
          }

          if(checkRecipient && checkGrant && checkScope1 && checkInnochain && checkEduchain){
            v.scope2Ids.forEach(id => {
              if(!tempS2[id]){
                tempS2[id] = true
                scopes2.push(id)
              }
            })
          }

          if(checkRecipient && checkGrant && checkScope1 && checkScope2 && checkEduchain){
            v.innochainIds.forEach(id => {
              if(!tempI[id]){
                tempI[id] = true
                innochains.push(id)
              }
            })
          }

          if(checkRecipient && checkGrant && checkScope1 && checkScope2 && checkInnochain){
            v.educhainIds.forEach(id => {
              if(!tempE[id]){
                tempE[id] = true
                educhains.push(id)
              }
            })
          }

        })
      }

      Vue.set(state.recipient, 'available', recipients)
      Vue.set(state.grant, 'available', grants)
      Vue.set(state.scope1, 'available', scopes1)
      Vue.set(state.scope2, 'available', scopes2)
      Vue.set(state.innochain, 'available', innochains)
      Vue.set(state.educhain, 'available', educhains)

      return foundations
    },

    foundationsAvailable(state, getters){
      let foundations = getters.foundations
      const slcB = state.bounds

      foundations = foundations.filter((v) => {
        return  (
          (v.coords.lat <= slcB.ne[0] && v.coords.lat >= slcB.sw[0]) &&
          (v.coords.lng <= slcB.ne[1] && v.coords.lng >= slcB.sw[1])
        )
      })

      return foundations
    }
  },
  actions: {
    loadLanguage({ commit, state }){
      ajax(`./data/language.${state.language.selected}.json`, (data) => {
        data = JSON.parse(data)
        commit('setLanguageTerms', { data: data })
        document.title = data.title
      })
    },
    loadFoudations({ commit, state }){
      return new Promise((resolve, reject) => {
        const dbDate = localStorage.getItem('dbDate')
        const dbFoundationArray = localStorage.getItem('foundationArray')

        if((Date.now() - dbDate) < state.cacheDuration && dbFoundationArray){
          commit('setData', { list: 'foundation', data: JSON.parse(dbFoundationArray) })
          resolve()
        } else {
          ajax('./data/foundations.csv', (data) => {
            const parsedCSV = Papa.parse(data, { header: true, skipEmptyLines: true })
            const foundationArray = parsedCSV.data.map(foundation => {
              return {
                id: parseInt(foundation.id),
                name: foundation.name.trim(),
                cheNumber: foundation.che_number.trim(),
                regionCanton: foundation.region_canton.trim(),
                regionTown: foundation.region_town.trim(),
                regionId: parseInt(foundation.regionId),
                recipientIds: foundation.recipientIds ? foundation.recipientIds.toString().split(',').map(id => parseInt(id)) : [],
                grantIds: foundation.grantIds ? foundation.grantIds.toString().split(',').map(id => parseInt(id)) : [],
                scope1Ids: foundation.scope1Ids ? foundation.scope1Ids.toString().split(',').map(id => parseInt(id)) : [],
                scope2Ids: foundation.scope2Ids ? foundation.scope2Ids.toString().split(',').map(id => parseInt(id)) : [],
                innochainIds: foundation.innochainIds ? foundation.innochainIds.toString().split(',').map(id => parseInt(id)) : [],
                educhainIds: foundation.educhainIds ? foundation.educhainIds.toString().split(',').map(id => parseInt(id)) : [],
                website: foundation.website.trim(),
                coords: {
                  lat: foundation.coords ? parseFloat(foundation.coords.toString().split(',')[0]) : 0,
                  lng: foundation.coords ? parseFloat(foundation.coords.toString().split(',')[1]) : 0
                }
              }
            })
            commit('setData', { list: 'foundation', data: foundationArray })
            localStorage.setItem('foundationArray', JSON.stringify(foundationArray))
            localStorage.setItem('dbDate', Date.now())
            resolve()
          }, (err) => {
            reject()
          })
        }
      })
    },
    loadRegions({ commit, state }){
      return new Promise((resolve, reject) => {
        const dbDate = localStorage.getItem('dbDate')
        const dbRegionArray = localStorage.getItem('regionArray')
        if((Date.now() - dbDate) < state.cacheDuration && dbRegionArray){
          commit('setData', { list: 'region', data: JSON.parse(dbRegionArray) })
          resolve()
        } else {
          ajax('./data/regions.csv', (data) => {
            const parsedCSV = Papa.parse(data, { header: true, skipEmptyLines: true })
            const regionArray = parsedCSV.data.map(region => {
              return {
                id: parseInt(region.id),
                de: region.de.trim(),
                fr: region.fr.trim(),
                it: region.it.trim(),
                en: region.en.trim()
              }
            })
            commit('setData', { list: 'region', data: regionArray })
            localStorage.setItem('regionArray', JSON.stringify(regionArray))
            resolve()
          }, (err) => {
            reject(err)
          })
        }
      })
    },
    loadRecipients({ commit, state }){
      return new Promise((resolve, reject) => {
        const dbDate = localStorage.getItem('dbDate')
        const dbRecipientArray = localStorage.getItem('recipientArray')
        if((Date.now() - dbDate) < state.cacheDuration && dbRecipientArray){
          commit('setData', { list: 'recipient', data: JSON.parse(dbRecipientArray) })
          resolve()
        } else {
          ajax('./data/recipients.csv', (data) => {
            const parsedCSV = Papa.parse(data, { header: true, skipEmptyLines: true })
            const recipientArray = parsedCSV.data.map(recipient => {
              return {
                id: parseInt(recipient.id),
                de: recipient.de.trim(),
                fr: recipient.fr.trim(),
                it: recipient.it.trim(),
                en: recipient.en.trim()
              }
            })
            commit('setData', { list: 'recipient', data: recipientArray })
            localStorage.setItem('recipientArray', JSON.stringify(recipientArray))
            resolve()
          }, (err) => {
            reject(err)
          })
        }
      })
    },
    loadGrants({ commit, state }){
      return new Promise((resolve, reject) => {
        const dbDate = localStorage.getItem('dbDate')
        const dbGrantsArray = localStorage.getItem('grantArray')
        if((Date.now() - dbDate) < state.cacheDuration && dbGrantsArray){
          commit('setData', { list: 'grant', data: JSON.parse(dbGrantsArray) })
          resolve()
        } else {
          ajax('./data/grants.csv', (data) => {
            const parsedCSV = Papa.parse(data, { header: true, skipEmptyLines: true })
            const grantArray = parsedCSV.data.map(grant => {
              return {
                id: parseInt(grant.id),
                de: grant.de.trim(),
                fr: grant.fr.trim(),
                it: grant.it.trim(),
                en: grant.en.trim()
              }
            })
            commit('setData', { list: 'grant', data: grantArray })
            localStorage.setItem('grantArray', JSON.stringify(grantArray))
            resolve()
          }, (err) => {
            reject(err)
          })
        }
      })
    },
    loadScopes1({ commit, state }){
      return new Promise((resolve, reject) => {
        const dbDate = localStorage.getItem('dbDate')
        const dbScopes1Array = localStorage.getItem('scope1Array')
        if((Date.now() - dbDate) < state.cacheDuration && dbScopes1Array){
          commit('setData', { list: 'scope1', data: JSON.parse(dbScopes1Array) })
          resolve()
        } else {
          ajax('./data/scopes1.csv', (data) => {
            const parsedCSV = Papa.parse(data, { header: true, skipEmptyLines: true })
            const scope1Array = parsedCSV.data.map(scope1 => {
              return {
                id: parseInt(scope1.id),
                de: scope1.de.trim(),
                fr: scope1.fr.trim(),
                it: scope1.it.trim(),
                en: scope1.en.trim()
              }
            })
            commit('setData', { list: 'scope1', data: scope1Array })
            localStorage.setItem('scope1Array', JSON.stringify(scope1Array))
            resolve()
          }, (err) => {
            reject(err)
          })
        }
      })
    },
    loadScopes2({ commit, state }){
      return new Promise((resolve, reject) => {
        const dbDate = localStorage.getItem('dbDate')
        const dbScopes2Array = localStorage.getItem('scope2Array')
        if((Date.now() - dbDate) < state.cacheDuration && dbScopes2Array){
          commit('setData', { list: 'scope2', data: JSON.parse(dbScopes2Array) })
          resolve()
        } else {
          ajax('./data/scopes2.csv', (data) => {
            const parsedCSV = Papa.parse(data, { header: true, skipEmptyLines: true })
            const scope2Array = parsedCSV.data.map(scope2 => {
              return {
                id: parseInt(scope2.id),
                de: scope2.de.trim(),
                fr: scope2.fr.trim(),
                it: scope2.it.trim(),
                en: scope2.en.trim()
              }
            })
            commit('setData', { list: 'scope2', data: scope2Array })
            localStorage.setItem('scope2Array', JSON.stringify(scope2Array))
            resolve()
          }, (err) => {
            reject(err)
          })
        }
      })
    },
    loadInnochains({ commit, state }){
      return new Promise((resolve, reject) => {
        const dbDate = localStorage.getItem('dbDate')
        const dbInnochainsArray = localStorage.getItem('innochainArray')
        if((Date.now() - dbDate) < state.cacheDuration && dbInnochainsArray){
          commit('setData', { list: 'innochain', data: JSON.parse(dbInnochainsArray) })
          resolve()
        } else {
          ajax('./data/innochains.csv', (data) => {
            const parsedCSV = Papa.parse(data, { header: true, skipEmptyLines: true })
            const innochainArray = parsedCSV.data.map(innochain => {
              return {
                id: parseInt(innochain.id),
                de: innochain.de.trim(),
                fr: innochain.fr.trim(),
                it: innochain.it.trim(),
                en: innochain.en.trim()
              }
            })
            commit('setData', { list: 'innochain', data: innochainArray })
            localStorage.setItem('innochainArray', JSON.stringify(innochainArray))
            resolve()
          }, (err) => {
            reject(err)
          })
        }
      })
    },
    loadEduchains({ commit, state }){
      return new Promise((resolve, reject) => {
        const dbDate = localStorage.getItem('dbDate')
        const dbEduchainsArray = localStorage.getItem('educhainArray')
        if((Date.now() - dbDate) < state.cacheDuration && dbEduchainsArray){
          commit('setData', { list: 'educhain', data: JSON.parse(dbEduchainsArray) })
          resolve()
        } else {
          ajax('./data/educhains.csv', (data) => {
            const parsedCSV = Papa.parse(data, { header: true, skipEmptyLines: true })
            const educhainArray = parsedCSV.data.map(educhain => {
              return {
                id: parseInt(educhain.id),
                de: educhain.de.trim(),
                fr: educhain.fr.trim(),
                it: educhain.it.trim(),
                en: educhain.en.trim()
              }
            })
            commit('setData', { list: 'educhain', data: educhainArray })
            localStorage.setItem('educhainArray', JSON.stringify(educhainArray))
            resolve()
          }, (err) => {
            reject(err)
          })
        }
      })
    },
    loadHash({ commit, state }){
      const params = getHashParams()
      let recipients = []
      let grants = []
      let scopes1 = []
      let scopes2 = []
      let innochains = []
      let educhains = []

      if(params.lang && params.lang != state.language.selected){
        commit('setLanguage', { data: params.lang })
      }

      if(params.recipient) recipients = params.recipient.split(',').map(id => parseInt(id))
      if(params.grant) grants = params.grant.split(',').map(id => parseInt(id))
      if(params.scope1) scopes1 = params.scope1.split(',').map(id => parseInt(id))
      if(params.scope2) scopes2 = params.scope2.split(',').map(id => parseInt(id))
      if(params.innochain) innochains = params.innochain.split(',').map(id => parseInt(id))
      if(params.educhain) educhains = params.educhain.split(',').map(id => parseInt(id))


      if(state.recipient.selected.toString() != recipients.toString()) commit('setSelected', { list: 'recipient', data: recipients })
      if(state.grant.selected.toString() != grants.toString()) commit('setSelected', { list: 'grant', data: grants })
      if(state.scope1.selected.toString() != scopes1.toString()) commit('setSelected', { list: 'scope1', data: scopes1 })
      if(state.scope2.selected.toString() != scopes2.toString()) commit('setSelected', { list: 'scope2', data: scopes2 })
      if(state.innochain.selected.toString() != innochains.toString()) commit('setSelected', { list: 'innochain', data: innochains })
      if(state.educhain.selected.toString() != educhains.toString()) commit('setSelected', { list: 'educhain', data: educhains })

    }
  }
})
