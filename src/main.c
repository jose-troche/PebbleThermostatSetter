#include <pebble.h>

#define MAX_DEVICES 2

enum {
  TEMPERATURE_CHANGE_KEY,
  THERMOSTAT_INDEX_KEY,
  THERMOSTAT_ID_KEY,
  THERMOSTAT_NAME_KEY,
  THERMOSTAT_TEMPERATURE_KEY
};

struct device {
  char id[20];
  char name[50];
  char temperature[6];
};

struct device devices[MAX_DEVICES] = {
  {"1", "Loading ...", "0°"},
  {"2", "Loading ...", "0°"}
};

static int selected_device = 0;

static Window *s_window;
static GBitmap *s_res_up;
static GBitmap *s_res_selector;
static GBitmap *s_res_down;
static GBitmap *s_res_thermometer;
static GFont s_res_bitham_42_bold;
static GFont s_res_gothic_28;
static ActionBarLayer *actionbarlayer;
static BitmapLayer *bitmaplayer;
static TextLayer *degreelayer;
static TextLayer *devicelayer;

static void update_ui(void){
  text_layer_set_text(degreelayer, devices[selected_device].temperature);
  text_layer_set_text(devicelayer, devices[selected_device].name);
}

static void in_received_handler(DictionaryIterator *iter, void *context) {
  Tuple *thermostat_id_tuple;
  Tuple *thermostat_name_tuple;
  Tuple *thermostat_temperature_tuple = dict_find(iter, THERMOSTAT_TEMPERATURE_KEY);
  Tuple *thermostat_index_tuple = dict_find(iter, THERMOSTAT_INDEX_KEY);
  int i;

  if (thermostat_index_tuple){
    i = thermostat_index_tuple->value->uint8;
    if (i < MAX_DEVICES){

      thermostat_id_tuple = dict_find(iter, THERMOSTAT_ID_KEY);
      if (thermostat_id_tuple){
        strcpy(devices[i].id, thermostat_id_tuple->value->cstring);
      }

      thermostat_name_tuple = dict_find(iter, THERMOSTAT_NAME_KEY);
      if (thermostat_name_tuple){
        strcpy(devices[i].name, thermostat_name_tuple->value->cstring);
        APP_LOG(APP_LOG_LEVEL_DEBUG, "Name: %s", devices[i].name);
      }

      if (thermostat_temperature_tuple) {
        strcpy(devices[i].temperature, thermostat_temperature_tuple->value->cstring);
      }

      update_ui();
    }
  }
  else {
    if (thermostat_temperature_tuple) {
      strcpy(devices[selected_device].temperature, thermostat_temperature_tuple->value->cstring);
      update_ui();
    }
  }
}

static void send_cmd(int delta, char * device_id) {
  DictionaryIterator *iter;
  app_message_outbox_begin(&iter);

  if (iter == NULL) {
    return;
  }

  Tuplet delta_tuple = TupletInteger(TEMPERATURE_CHANGE_KEY, delta);
  dict_write_tuplet(iter, &delta_tuple);

  Tuplet device_tuple = TupletCString(THERMOSTAT_ID_KEY, device_id);
  dict_write_tuplet(iter, &device_tuple);

  dict_write_end(iter);

  app_message_outbox_send();
}


static void select_click_handler(ClickRecognizerRef recognizer, void *context) {
  selected_device = (selected_device + 1) % MAX_DEVICES;
  update_ui();
}

static void up_click_handler(ClickRecognizerRef recognizer, void *context) {
  text_layer_set_text(devicelayer, "Raising ...");
  send_cmd(1, devices[selected_device].id);
}

static void down_click_handler(ClickRecognizerRef recognizer, void *context) {
  text_layer_set_text(devicelayer, "Lowering ...");
  send_cmd(-1, devices[selected_device].id);
}

static void click_config_provider(void *context) {
  window_single_click_subscribe(BUTTON_ID_SELECT, select_click_handler);
  window_single_click_subscribe(BUTTON_ID_UP, up_click_handler);
  window_single_click_subscribe(BUTTON_ID_DOWN, down_click_handler);
}

static void initialise_ui(void) {
  s_window = window_create();
  window_set_background_color(s_window, GColorBlack);
  window_set_fullscreen(s_window, false);
  
  s_res_up = gbitmap_create_with_resource(RESOURCE_ID_UP);
  s_res_selector = gbitmap_create_with_resource(RESOURCE_ID_SELECTOR);
  s_res_down = gbitmap_create_with_resource(RESOURCE_ID_DOWN);
  s_res_thermometer = gbitmap_create_with_resource(RESOURCE_ID_THERMOMETER);
  s_res_bitham_42_bold = fonts_get_system_font(FONT_KEY_BITHAM_42_BOLD);
  s_res_gothic_28 = fonts_get_system_font(FONT_KEY_GOTHIC_28);
  // actionbarlayer
  actionbarlayer = action_bar_layer_create();
  action_bar_layer_add_to_window(actionbarlayer, s_window);
  action_bar_layer_set_background_color(actionbarlayer, GColorWhite);
  action_bar_layer_set_icon(actionbarlayer, BUTTON_ID_UP, s_res_up);
  action_bar_layer_set_icon(actionbarlayer, BUTTON_ID_SELECT, s_res_selector);
  action_bar_layer_set_icon(actionbarlayer, BUTTON_ID_DOWN, s_res_down);
  action_bar_layer_set_click_config_provider(actionbarlayer, click_config_provider);
  layer_add_child(window_get_root_layer(s_window), (Layer *)actionbarlayer);
  
  // bitmaplayer
  bitmaplayer = bitmap_layer_create(GRect(5, 0, 41, 94));
  bitmap_layer_set_bitmap(bitmaplayer, s_res_thermometer);
  layer_add_child(window_get_root_layer(s_window), (Layer *)bitmaplayer);
  
  // degreelayer
  degreelayer = text_layer_create(GRect(40, 16, 78, 42));
  text_layer_set_background_color(degreelayer, GColorBlack);
  text_layer_set_text_color(degreelayer, GColorWhite);
  text_layer_set_text_alignment(degreelayer, GTextAlignmentRight);
  text_layer_set_font(degreelayer, s_res_bitham_42_bold);
  layer_add_child(window_get_root_layer(s_window), (Layer *)degreelayer);
  
  // devicelayer
  devicelayer = text_layer_create(GRect(8, 93, 100, 56));
  text_layer_set_background_color(devicelayer, GColorBlack);
  text_layer_set_text_color(devicelayer, GColorWhite);
  text_layer_set_font(devicelayer, s_res_gothic_28);
  layer_add_child(window_get_root_layer(s_window), (Layer *)devicelayer);

  update_ui();
}

static void destroy_ui(void) {
  window_destroy(s_window);
  action_bar_layer_destroy(actionbarlayer);
  bitmap_layer_destroy(bitmaplayer);
  text_layer_destroy(degreelayer);
  text_layer_destroy(devicelayer);
  gbitmap_destroy(s_res_up);
  gbitmap_destroy(s_res_selector);
  gbitmap_destroy(s_res_down);
  gbitmap_destroy(s_res_thermometer);
}

static void handle_window_unload(Window* window) {
  destroy_ui();
}

static void show_mainwindow(void) {
  initialise_ui();
  window_set_window_handlers(s_window, (WindowHandlers) {
    .unload = handle_window_unload,
  });
  window_stack_push(s_window, true);
}

static void init(void) {
  app_message_register_inbox_received(in_received_handler);

  const int inbound_size = 64;
  const int outbound_size = 64;
  app_message_open(inbound_size, outbound_size);
}

int main(void) {
  init();
  show_mainwindow();
  app_event_loop();
  return 0;
}
