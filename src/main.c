#include <pebble.h>
#include "window.h"

void send_cmd(int delta, char * device_id) {
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

void in_received_handler(DictionaryIterator *iter, void *context);

static void init(void) {
  app_message_register_inbox_received(in_received_handler);

  const int inbound_size = 96;
  const int outbound_size = 64;
  app_message_open(inbound_size, outbound_size);
}

int main(void) {
  init();
  show_mainwindow();
  app_event_loop();
  return 0;
}
