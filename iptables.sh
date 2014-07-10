#!/bin/sh
#
# Set up the iptables rules. Not really part of the alert system, but it's important to lock the system down.
#

setup_iptables () {
	$IPTABLES -F
	$IPTABLES -X
	$IPTABLES -P INPUT DROP
	$IPTABLES -P FORWARD DROP

	$IPTABLES -N LOGGING

	$IPTABLES -A INPUT -i lo -j ACCEPT
	$IPTABLES -A INPUT -m state --state ESTABLISHED -j ACCEPT
	if [ "$IPTABLES" = 'iptables' ]; then
		$IPTABLES -A INPUT -p icmp -j ACCEPT
	else
		$IPTABLES -A INPUT -p icmpv6 -j ACCEPT
	fi
	# ssh, http, and monit
	$IPTABLES -A INPUT -p tcp -m multiport --dports 22,80,2812 -m state --state NEW,ESTABLISHED -j ACCEPT
	$IPTABLES -A INPUT -p udp --dport 5353 -j ACCEPT
	$IPTABLES -A INPUT -j LOGGING

	# Ignore some chatty ports
	$IPTABLES -A LOGGING -p udp --dport 17500 -j DROP
	$IPTABLES -A LOGGING -p udp --dport 8612 -j DROP
	if [ "$IPTABLES" = 'iptables' ]; then
		$IPTABLES -A LOGGING -m limit --limit 2/min -j LOG --log-prefix "IPv4 Dropped: " --log-level 7
	else
		$IPTABLES -A LOGGING -m limit --limit 2/min -j LOG --log-prefix "IPv6 Dropped: " --log-level 7
	fi
	$IPTABLES -A LOGGING -j DROP
}

IPTABLES=iptables setup_iptables
IPTABLES=ip6tables setup_iptables
