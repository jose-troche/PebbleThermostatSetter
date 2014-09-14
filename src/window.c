#include "window.h"
#include <pebble.h>

// BEGIN AUTO-GENERATED UI CODE; DO NOT MODIFY
static Window *s_window;
static GBitmap *s_res_up;
static GBitmap *s_res_left;
static GBitmap *s_res_down;
static GBitmap *s_res_thermometer;
static GFont s_res_bitham_42_bold;
static GFont s_res_gothic_28;
static ActionBarLayer *actionbarlayer;
static BitmapLayer *bitmaplayer;
static TextLayer *degreelayer;
static TextLayer *devicelayer;

static void initialise_ui(void) {
  s_window = window_create();
  window_set_background_color(s_window, GColorBlack);
  window_set_fullscreen(s_window, false);
  
  s_res_up = gbitmap_create_with_resource(RESOURCE_ID_UP);
  s_res_left = gbitmap_create_with_resource(RESOURCE_ID_LEFT);
  s_res_down = gbitmap_create_with_resource(RESOURCE_ID_DOWN);
  s_res_thermometer = gbitmap_create_with_resource(RESOURCE_ID_THERMOMETER);
  s_res_bitham_42_bold = fonts_get_system_font(FONT_KEY_BITHAM_42_BOLD);
  s_res_gothic_28 = fonts_get_system_font(FONT_KEY_GOTHIC_28);
  // actionbarlayer
  actionbarlayer = action_bar_layer_create();
  action_bar_layer_add_to_window(actionbarlayer, s_window);
  action_bar_layer_set_background_color(actionbarlayer, GColorWhite);
  action_bar_layer_set_icon(actionbarlayer, BUTTON_ID_UP, s_res_up);
  action_bar_layer_set_icon(actionbarlayer, BUTTON_ID_SELECT, s_res_left);
  action_bar_layer_set_icon(actionbarlayer, BUTTON_ID_DOWN, s_res_down);
  layer_add_child(window_get_root_layer(s_window), (Layer *)actionbarlayer);
  
  // bitmaplayer
  bitmaplayer = bitmap_layer_create(GRect(9, 11, 25, 59));
  bitmap_layer_set_bitmap(bitmaplayer, s_res_thermometer);
  layer_add_child(window_get_root_layer(s_window), (Layer *)bitmaplayer);
  
  // degreelayer
  degreelayer = text_layer_create(GRect(35, 16, 78, 42));
  text_layer_set_background_color(degreelayer, GColorBlack);
  text_layer_set_text_color(degreelayer, GColorWhite);
  text_layer_set_text(degreelayer, "22°");
  text_layer_set_text_alignment(degreelayer, GTextAlignmentRight);
  text_layer_set_font(degreelayer, s_res_bitham_42_bold);
  layer_add_child(window_get_root_layer(s_window), (Layer *)degreelayer);
  
  // devicelayer
  devicelayer = text_layer_create(GRect(13, 78, 100, 56));
  text_layer_set_background_color(devicelayer, GColorBlack);
  text_layer_set_text_color(devicelayer, GColorWhite);
  text_layer_set_text(devicelayer, "Device Name");
  text_layer_set_font(devicelayer, s_res_gothic_28);
  layer_add_child(window_get_root_layer(s_window), (Layer *)devicelayer);
}

static void destroy_ui(void) {
  window_destroy(s_window);
  action_bar_layer_destroy(actionbarlayer);
  bitmap_layer_destroy(bitmaplayer);
  text_layer_destroy(degreelayer);
  text_layer_destroy(devicelayer);
  gbitmap_destroy(s_res_up);
  gbitmap_destroy(s_res_left);
  gbitmap_destroy(s_res_down);
  gbitmap_destroy(s_res_thermometer);
}
// END AUTO-GENERATED UI CODE

static void handle_window_unload(Window* window) {
  destroy_ui();
}

void show_mainwindow(void) {
  initialise_ui();
  window_set_window_handlers(s_window, (WindowHandlers) {
    .unload = handle_window_unload,
  });
  window_stack_push(s_window, true);
}

void hide_mainwindow(void) {
  window_stack_remove(s_window, true);
}
