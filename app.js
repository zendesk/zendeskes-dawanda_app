(function() {
  var xml2json = require('xml2json.js');
  return {
  	requests:{
  	  'retrieveOrder': function(id){
  	    return {
          url:'https://dawanda.com/seller_api/orders/'+id+'?v=1.1',
          type: 'GET',
          beforeSend: function(data){
            data.setRequestHeader("X-Dawanda-Auth","{{setting.dawanda_token}}");
          },
          secure: true
        };     		
  	  }
  	},
    events: {
      'app.activated':'initial_load',
      'click .dw-search':'search',
      'retrieveOrder.done':'loadOrder',
      'retrieveOrder.fail':'loadEmptyTemplate',
      '*.changed':'searchIfCustomFieldChanged'
    },

    initial_load: function() {
      this.switchTo('loading');
    	var order_field = this.requirement('order_id');
		  var order_id = this.ticket().customField('custom_field_'+order_field.requirement_id);
      if(order_id !== undefined && order_id !== ""){
        this.ajax('retrieveOrder',order_id);  
      }else{
        this.loadEmptyTemplate();
      }
		  
    },
    searchIfCustomFieldChanged: function(e){
      var propertyName = e.propertyName;
      var order_field = this.requirement('order_id');
      if(propertyName == 'ticket.custom_field_' + order_field.requirement_id){
        this.initial_load();
      }
    },
    search: function(){
      var val = this.$('#dw-searcher').val();
      this.ajax('retrieveOrder',val);
      this.switchTo('loading');
      
    },
    loadOrder: function(d){
      var data = this.buildOrder(xml2json.tools.parseXml(d));
      this.switchTo('order_view',data);
    },
    loadEmptyTemplate: function(){
      this.switchTo('no_order_found');
    },
    buildOrder: function(xml2jsonObject){
      var order = xml2jsonObject[0].order[0];
      var baline2 = order.invoice_address[0].jAttr["line2"] === undefined ? "":order.invoice_address[0].jAttr["line2"];
      var baline3 = order.invoice_address[0].jAttr["line3"] === undefined ? "":order.invoice_address[0].jAttr["line3"];
      var saline2 = order.shipping_address[0].jAttr["line2"] === undefined ? "":order.shipping_address[0].jAttr["line2"];
      var saline3 = order.shipping_address[0].jAttr["line3"] === undefined ? "":order.shipping_address[0].jAttr["line3"];
      var jsonObject = {
        order: {
          summary: {
            id: order.jAttr.id,
            created_at: this.calcDate(order.jAttr.created_at),
            confirmed_at: this.calcDate(order.order_status[0].jAttr.confirmed_at),
            status: order.order_status[0].jAttr.status,
            sent_at: this.calcDate(order.order_status[0].jAttr.sent_at),
            marked_as_paid_at: this.calcDate(order.order_status[0].jAttr.marked_as_paid_at),
            cents_total: this.calcValue(order.jAttr.cents_total),
            cents_total_shipping: this.calcValue(order.jAttr.cents_total_shipping),
            currency: order.payment_info[0].jAttr.paid_currency,
            paid_cents: order.payment_info[0].jAttr.paid_cents,
            payment_type: order.payment_info[0].payment_provider_info[0].jValue
          },
          order_details: _.map(order.order_items[0].order_item,function(item){
                          return {
                            product_name: item.jAttr.product_title,
                            quantity: item.jAttr.quantity,
                            cents: this.calcValue(item.jAttr.cents),
                            shipping_itl: this.calcValue(item.jAttr.cents_shipping_international),
                            shipping_domestic: this.calcValue(item.jAttr.cents_shipping_domestic)
                          };
                        },this),
          billing_address: {
            lastname: order.invoice_address[0].jAttr["lastname"],
            firstname: order.invoice_address[0].jAttr["firstname"],
            street: order.invoice_address[0].jAttr["street"],
            line2: baline2,
            line3: baline3,
            country: order.invoice_address[0].jAttr["country"],
            zip: order.invoice_address[0].jAttr["zip"],
            city: order.invoice_address[0].jAttr["city"]
          },
          shipping_address: {
            lastname: order.shipping_address[0].jAttr["lastname"],
            firstname: order.shipping_address[0].jAttr["firstname"],
            street: order.shipping_address[0].jAttr["street"],
            line2: saline2,
            line3: saline3,
            country: order.shipping_address[0].jAttr["country"],
            zip: order.shipping_address[0].jAttr["zip"],
            city: order.shipping_address[0].jAttr["city"]
          }
        }
      };
      return jsonObject;
    },
    calcValue: function(v){
      var res = 0;
      if(v !== undefined){
        v = parseInt(v,0);
        if(v!==0){
          res = v/100;
        }
      }
      return res;
    },
    calcDate: function(d){
      var res;
      if(d !== undefined){
        res = new Date(d*1000);
      }else{
        res = "";
      }
      return res;
    }
  };

}());