import sys
import gi

gi.require_version('Gtk', '3.0')
from gi.repository import Gtk, Gdk

class MainWindow(Gtk.Window):

    def __init__(self, text):
        # Cria a janela principal
        title = sys.argv[1]
        super().__init__(title=title)
        self.set_default_size(800, 600)

        # Cria um TextView para exibir o texto
        self.text_view = Gtk.TextView()
        self.text_view.set_editable(True)
        self.text_view.set_cursor_visible(True)
        self.text_view.set_wrap_mode(Gtk.WrapMode.WORD)

        # Define o texto inicial
        self.text_view.get_buffer().set_text(text)

        # Adiciona uma barra de rolagem ao TextView
        scroll = Gtk.ScrolledWindow()
        scroll.set_policy(Gtk.PolicyType.NEVER, Gtk.PolicyType.AUTOMATIC)
        scroll.add(self.text_view)

        # Adiciona o TextView à janela principal
        self.add(scroll)
        self.show_all()


        # Cria um menu de contexto para o TextView
        # gdk_wayland_window_handle_configure_popup: assertion 'impl->transient_for'
        menu = Gtk.Menu()
        copy_item = Gtk.MenuItem(label="Copiar")
        copy_item.connect("activate", self.on_copy)
        menu.append(copy_item)


    def on_copy(self, widget):
        clipboard = Gdk.Clipboard.get(Gdk.SELECTION_CLIPBOARD)
        clipboard.set_text(self.text_view.get_buffer().get_text())

    def on_button_press(self, widget, event, menu):
        if event.button == 3:
            menu.popup(None, None, None, None, event.button, event.time)
            return True

if __name__ == "__main__":
    # Obtém o texto da linha de comando
    text = " ".join(sys.argv[2:])

    # Cria a janela principal
    win = MainWindow(text)
    win.connect("delete-event", Gtk.main_quit)
    win.show_all()
    Gtk.main()
