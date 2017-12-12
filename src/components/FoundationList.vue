<template>
  <div class="list-container">
    <div class="ui segment basic vertical right aligned">
      <button @click="exportData" class="ui icon left floated mini compact labeled button small-padding">
        <i class="icon download"></i>{{ term('export') }} (CSV)
      </button>
      <div class="ui label">
        <i class="icon users"></i> {{ numFoundations }}
      </div>
    </div>
    <div class="ui vertical segment clearing right aligned small-padding">
      <span>{{ term('sort_by') }} </span>
      <div class="ui inline dropdown" @focus="setActive()" @blur="setInactive()" @keydown="sortKeyNav($event)" tabindex="0">
        <div class="text" @click="setActive()">{{ term(sortOptions[sortIndex].label) }}</div>
        <div :class="[sortSelectionActive ? 'active visible':'','menu left']">
          <div v-for="(option, index) in sortOptions"
            :key="`sort.option.${option.label}`"
            :class="[option.label == sortOptions[sortIndex].label ? 'active selected':'', 'item']"
            @click="sortBy(index)">

            {{ term(option.label) }}

          </div>
        </div>
        <i class="dropdown icon"></i>
      </div>
    </div>

    <foundation-list-item v-for="foundation in foundationsShow" :key="`foundation.list.${foundation.id}`" v-bind:foundation="foundation"></foundation-list-item>

    <div v-if="isLoading" class="ui vertical segment basic">
      <div class="ui active centered inline loader small"></div>
    </div>

    <div v-if="numFoundations == 0 && !isLoading" class="ui vertical center aligned segment basic very padded">
      <div class="ui compact message">{{term('no_results')}}</div>
    </div>

    <div class="ui vertical center aligned segment basic ">
      <div v-html="showMoreHintTerm"></div>
    </div>

    <div v-if="numFoundations > foundationsShow.length" class="ui vertical center aligned segment basic">
      <button class="ui button primary icon centered thin" @click="showMore()">{{ term('show_more') }}</button>
    </div>

  </div>
</template>

<script>
  import FoundationListItem from './FoundationListItem.vue'
  import { saveAs, sortLocale } from './../util.js'
  import Papa from 'papaparse'

  export default {
    name: 'foundation-list',
    components: { FoundationListItem },
    props: [],
    data: function(){
      return {
        sortIndex: 0,
        sortSelectionActive: false,
        sortOptions: [
          {
            label: 'foundation',
            sort_key: 'name',
          },
          {
            label: 'che_number',
            sort_key: 'cheNumber',
          }
        ],
        amountToShow: 15,
        amountToAdd: 15
      }
    },
    computed: {
      isLoading(){
        return this.$store.state.foundation.list.length == 0
      },
      numFoundations(){
        return this.foundations.length
      },
      foundations(){
        let foundations = this.$store.getters.foundationsAvailable;
        const key = this.sortOptions[this.sortIndex].sort_key
        foundations = foundations.sort(sortLocale(key))
        this.amountToShow = this.amountToAdd
        return foundations
      },
      foundationsShow(){
        const foundations = this.foundations.slice(0, this.amountToShow)
        return foundations
      },
      showMoreHintTerm(){
        let term = this.term('show_more_hint')
        const numTemp = this.amountToShow;
        const numTotal = this.numFoundations
        term = term.replace('[amount]', numTemp < numTotal ? `<strong>${numTemp}</strong>` : `<strong>${numTotal}</strong>`)
        term = term.replace('[total]', `<strong>${numTotal}</strong>`)
        return term
      }
    },
    methods: {
      term(term){
        return this.$store.getters.term(term)
      },
      sortKeyNav(e){
        if(e.which === 38) {
          e.preventDefault()
          if(this.sortIndex > 0) this.sortIndex--
        } else if(e.which === 40){
          e.preventDefault()
          if(this.sortIndex < this.sortOptions.length-1) this.sortIndex++
        } else if(e.which === 13 || e.which === 27){
          e.preventDefault()
          this.setInactive()
        }
      },
      setActive(){
        if(!this.sortSelectionActive) this.sortSelectionActive = true
      },
      setInactive(){
        this.sortSelectionActive = false
      },
      sortBy(index){
        this.sortIndex = index
        this.setInactive()
      },
      showMore(){
        this.amountToShow += this.amountToAdd
      },
      exportData(){
        const foundationsLength = this.foundations.length
        const table = []
        for(let i = 0; i < foundationsLength; i++){
          const foundation = this.foundations[i]
          const row = {
            [this.term('foundation')]: group.name,
            [this.term('head')]: group.heads.map(head => head.name).join(', '),
            [this.term('institution')]: group.institution,
            [this.term('department')]: group.department,
            [this.term('institute')]: group.institute,
            [this.term('canton')]: group.canton,
            [this.term('website')]: group.website,
            [this.term('topic')]: group.topics.map(topic => topic.name).join(', '),
            Latitude: group.coords.lat,
            Longitude: group.coords.lng
          }
          table.push(row)
        }

        const csv = Papa.unparse(table, {
          quotes: false,
          delimiter: ";"
        })

        const blob = new Blob([`\ufeff${csv}\r\n${this.term('source_message')}`], {type: "text/csv;charset=ANSI"})
        saveAs(blob, `${this.term('export_name')}.csv`);
      }
    },
    updated: function(){
      this.eventHub.$emit('app-resize')
    }
  }
</script>

<style lang="less">
  .list-container {
    position: relative;
    z-index: 900;

    .menu.active.visible {
      display: block;
    }

    .ui.header {
      margin-top: 0;
    }
    .ui.segment.small-padding {
      padding: 0.25em 0;
    }
    .ui.button.thin {
      font-weight: normal;
    }

    .ui.labels {
      .label {
        font-weight: normal;
        font-size: 0.925em;

        &.bold {
          font-weight: bold;
        }
      }
    }
  }
</style>
