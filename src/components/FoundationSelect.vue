<template>
  <div :class="[size ? size : 'eight', 'wide', 'field']">
    <label>
      <i :class="[icon, 'icon']"></i> <span>{{ title }}</span>
    </label>

    <div tabindex="-1" ref="dropdown" @keydown="addFirstSelected($event)" @focus="setActive()" @blur="setInactive($event)" :class="[isLoading ? 'loading':'', active ? 'active visible':'', 'ui fluid selection dropdown']">
      <i class="dropdown icon"></i>

      <div class="text" v-if="selected.length > 0">{{selectedWidthInfo.name}}</div>

      <div v-show="active" class="menu active visible" ref="menu">
        <template v-if="active">
          <div
            v-for="opt in options"
            :key="`opt.${label}.${opt.id}`"
            :class="[
              opt.main ? 'bold' : '',
              opt.id === options[index].id ? 'selected':'',
              'item'
            ]"
            :data-value="opt.id"
            @click="setSelected(opt.id)" v-html="opt.name"
          ><span v-if="opt.short">({{opt.short}})</span>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script>

  import { sortLocale } from './../util.js'


  export default {
    name: 'foundation-select',
    props: ['data','label', 'icon', 'size'],
    data: function(){
      return {
        active: false,
        index: 0,
        amountToShow: 10
      }
    },
    methods: {
      addFirstSelected(e){
        e.preventDefault();
        if(e.which === 13){
          if(this.options.length > 0) this.setSelected(this.options[this.index].id)
        } else if(e.which === 40){
          if(this.index < this.options.length-1) this.index++
        } else if(e.which === 38){
          if(this.index > -1) this.index--
        } else if(e.which === 8){
          if(this.query.length < 1){
            if(this.selected.length > 0) this.removeSelected(this.selected[this.selected.length-1])
          }
        }
      },
      setSelected(id) {
        if(id){
          this.selected = [id]
        } else {
          this.removeSelected()
        }
        this.$refs.dropdown.blur()
      },
      removeSelected(id) {
        this.selected = []
        this.index = 0
        this.$refs.dropdown.blur()
      },
      setActive(e){
        this.active = true
        if(this.selected[0]){
          this.index = this.options.map(o => o.id).indexOf(this.selected[0])
        } else {
          this.index = 0
        }
      },
      setInactive(e){
        this.active = false
        this.$refs.menu.scrollTop = 0
        this.amountToShow = 10
      }
    },
    computed: {
      title(){
        return this.$store.getters.term(this.label)
      },
      isLoading(){
        return this.$store.state[this.label].list < 1
      },
      options(){
        const amount = this.amountToShow
        const options = this.data.sort(sortLocale('name')).slice(0, amount)
        options.unshift({id: null, name: '&nbsp;' })
        return options
      },
      selected: {
        get(){
          return this.$store.state[this.label].selected
        },
        set(value){
          this.$store.commit('setSelected', {
            list: this.label,
            data: value
          })
          if(this.label === 'scope1'){
            this.$store.commit('setSelected', {
              list: 'innochain',
              data: []
            })
            this.$store.commit('setSelected', {
              list: 'educhain',
              data: []
            })
          }
        }
      },
      selectedWidthInfo() {
        if(!this.isLoading){
          const options = this.options
          return this.selected.map((id) => this.$store.state[this.label].data[id])[0]
        } else {
          return []
        }
      }
    },

    mounted: function(){
      this.$refs.menu.addEventListener('scroll', (e) => {
        if(e.target.clientHeight + e.target.scrollTop + 50 > e.target.scrollHeight) {
          this.amountToShow += 10
        }
      })
    },
    destroyed: function(){
    },
    updated: function(){
      this.eventHub.$emit('app-resize')
    }
  }
</script>

<style lang="less">
  .ui.selection.dropdown {
    .menu {
      max-height: 24em !important;
      &>.item {
        &.bold {
          font-weight: 900;
        }
      }
    }
    .menu.active.visible {
      display: block;
    }
  }
</style>
