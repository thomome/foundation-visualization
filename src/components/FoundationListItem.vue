<template>
  <div class="ui vertical segment">
    <button class="ui right floated icon button mini basic primary" @click="locate(foundation.id)">
      <i class="icon marker"></i>
    </button>
    <a v-if="foundation.cheNumber != 0" class="ui right floated button mini basic icon primary" target="_blank" :href="cheLink">
      <i class="icon arrow right"></i>
      {{ foundation.cheNumber }}
    </a>
    <h4 class="ui header">
      <a target="_blank" v-if="foundation.website" :href="foundation.website">{{ foundation.name }} <sup><i class="icon external"></i></sup></a>
      <span v-if="!foundation.website">{{ foundation.name }}</span>

      <div class="sub header">
        {{ scopes }}
      </div>
    </h4>
    <div class="description">
      <div v-if="foundation.scope1Ids.indexOf(1) !== -1">
        <strong>{{ term('innochain') }}</strong><br>
        <div class="ui breadcrumb small chain-breadcrumb">
          <template v-for="(innochain, index) in foundation.innochains">
            <div class="section">{{ innochain.name }}</div>
            <div v-if="index+1 < foundation.innochains.length" class="divider">&shy;/&shy;</div>
          </template>
        </div>
      </div>
      <div v-if="foundation.scope1Ids.indexOf(2) !== -1">
        <strong>{{ term('educhain') }}</strong><br>
        <div class="ui breadcrumb small chain-breadcrumb">
          <template v-for="(educhain, index) in foundation.educhains">
            <div class="section">{{ educhain.name }}</div>
            <div v-if="index+1 < foundation.educhains.length" class="divider">&shy;/&shy;</div>
          </template>
        </div>
      </div>
      <p>
        <span>{{ term('grant')}}: <strong>{{ grants }}</strong></span><br>
        <span>{{ term('recipient')}}: <strong>{{ recipients }}</strong></span><br>
        <span>{{ term('region') }}: <strong>{{ region }}</strong></span><br>
      </p>

    </div>
  </div>
</template>

<script>
  export default {
    name: 'foundation-list-item',
    props: ['foundation'],
    data: function(){
      return {}
    },
    computed: {
      cheLink() {
        return `https://www.uid.admin.ch/Detail.aspx?uid_id=${this.foundation.cheNumber.replace(/[.-]/g, '')}`
      },
      recipients() {
        const terms = this.$store.state.language.terms
        return this.foundation.recipients.map(r => r.name).join(', ')
      },
      scopes() {
        const terms = this.$store.state.language.terms
        return `${this.foundation.scopes2.map(s => s.name).join(' & ')} | ${this.foundation.scopes1.map(s => s.name).join(' & ')}`
      },
      grants() {
        const terms = this.$store.state.language.terms
        return this.foundation.grants.map(g => g.name).join(', ')
      },
      region() {
        const terms = this.$store.state.language.terms
        let region = this.foundation.region.name
        let extra = ''
        switch (this.foundation.region.id){
          case 1:
          case 2:
            extra = `(${this.foundation.regionTown})`
            break;
          case 3:
            extra = `(${this.foundation.regionCanton})`
            break;
        }
        return `${region} ${extra}`
      }
    },
    methods: {
      term(term){
        return this.$store.getters.term(term)
      },
      locate(id){
        this.eventHub.$emit('map-locate', id)
      }
    }
  }
</script>
