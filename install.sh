#!/bin/sh
#
# Installs the upstart and monit configuration so the nursery alert starts on boot
# Run this as root (i.e. -> sudo ./install.sh)

./iptables.sh
cp nursery-alert.conf /etc/init/
cp nursery-alert-display.conf /etc/init/
cp nursery-alert.monit /etc/monit/conf.d/
initctl reload-configuration
monit reload
