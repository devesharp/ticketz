import React, { useContext, useEffect, useRef, useState } from "react";
import { useHistory } from "react-router-dom";

import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import SearchIcon from "@material-ui/icons/Search";
import InputBase from "@material-ui/core/InputBase";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import Badge from "@material-ui/core/Badge";
import MoveToInboxIcon from "@material-ui/icons/MoveToInbox";
import CheckBoxIcon from "@material-ui/icons/CheckBox";

import FormControlLabel from "@material-ui/core/FormControlLabel";
import Switch from "@material-ui/core/Switch";

import NewTicketModal from "../NewTicketModal";
import TicketsList from "../TicketsListCustom";
import TabPanel from "../TabPanel";

import { i18n } from "../../translate/i18n";
import { AuthContext } from "../../context/Auth/AuthContext";
import { Can } from "../Can";
import TicketsQueueSelect from "../TicketsQueueSelect";
import {Button, Typography} from "@material-ui/core";
import { TagsFilter } from "../TagsFilter";
import { UsersFilter } from "../UsersFilter";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPeopleGroup } from '@fortawesome/free-solid-svg-icons';
import api from "../../services/api";
import useSettings from "../../hooks/useSettings";

const useStyles = makeStyles((theme) => ({
  ticketsRoot: {
    position: "relative",
    display: "flex",
    height: "100%",
    flexDirection: "column",
    overflow: "hidden",
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    borderRight: "1px solid #e0e0e0",
  },

  ticketsWrapper: {
    position: "relative",
    display: "flex",
    height: "100%",
    flexDirection: "column",
    // overflow: "hidden",
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },

  tabsHeader: {
    flex: "none",
    padding: 0,
   // backgroundColor: "#eee",
  },

  settingsIcon: {
    alignSelf: "center",
    marginLeft: "auto",
    padding: 8,
    paddingLeft: 15,
  },

  tabWithGroups: {
    minWidth: 90,
    width: 90,
  },

  tab: {
    minWidth: 120,
    fontSize: 12,
    fontWeight: 700,
    // width: 120,
    minHeight: 0
  },

  tabSelected: {
    // background: theme.palette.primary.main,
    // color: 'white !important',
    // borderRadius: 30
  },

  tabsGroup: {
    borderBottom: "1px solid #e0e0e0",
    // background: '#eeeeee',
    padding: 0,
    minHeight: 0,
    // borderRadius: 30
  },

  tabsSubGroup: {
    minHeight: 0,
    padding: 10
  },
  tabSub: {
    marginBottom: 5,
    padding: '5px 16px',
    background: '#eeeeee',
    borderRadius: 100,
    marginRight: 5,
    fontSize: 12,
    fontWeight: 600,
    margin: 0,
    minWidth: 0,
    minHeight: 0
  },
  tabSubSelected: {
    background: theme.palette.primary.main,
    color: 'white !important',
  },
  tabSubWrapper: {
    // width: 0,
  },

  ticketOptionsBox: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    // background: "#fafafa",
    padding: theme.spacing(1),
  },

  serachInputWrapper: {
    flex: 1,
    // background: "#fff",
    display: "flex",
    borderRadius: 40,
    padding: 4,
    marginRight: theme.spacing(1),
  },

  searchIcon: {
    color: "grey",
    marginLeft: 6,
    marginRight: 6,
    alignSelf: "center",
  },

  searchInput: {
    flex: 1,
    border: "none",
    borderRadius: 30,
  },

  badge: {
    '& > .MuiBadge-badge': {
      position: 'static',
      top: 0,
      bottom: 0,
      transform: 'none',
      marginLeft: 4
    },
    '& > .MuiBadge-invisible': {
      display: 'none',
    }
  },
  show: {
    display: "block",
  },
  hide: {
    display: "none !important",
  },

  icon24: {
    width: 24,
    height: 24,
  },
}));

const TicketsManagerTabs = () => {
  const classes = useStyles();
  const history = useHistory();

  const [searchParam, setSearchParam] = useState("");
  const [tab, setTab] = useState("open");
  const [tabOpen, setTabOpen] = useState("open");
  const [newTicketModalOpen, setNewTicketModalOpen] = useState(false);
  const [showAllTickets, setShowAllTickets] = useState(false);
  const searchInputRef = useRef();
  const { user } = useContext(AuthContext);
  const { profile } = user;

  const [openCount, setOpenCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  const userQueueIds = user.queues.map((q) => q.id);
  const [selectedQueueIds, setSelectedQueueIds] = useState(userQueueIds || []);
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);

  const { getSetting } = useSettings();
  const [showTabGroups, setShowTabGroups] = useState(false);

  useEffect(() => {
    Promise.all([
      getSetting("CheckMsgIsGroup"),
      getSetting("groupsTab")
    ]).then(([ignoreGroups, groupsTab]) => {
      setShowTabGroups(ignoreGroups === "disabled" && groupsTab === "enabled");
    });
  }, []);

  useEffect(() => {
    if (user.profile.toUpperCase() === "ADMIN") {
      setShowAllTickets(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (tab === "search") {
      searchInputRef.current.focus();
    }
  }, [tab]);

  let searchTimeout;

  const handleSearch = (e) => {
    const searchedTerm = e.target.value.toLowerCase();

    clearTimeout(searchTimeout);

    searchTimeout = setTimeout(() => {
      setSearchParam(searchedTerm);
    }, 500);
  };

  const handleChangeTab = (e, newValue) => {
    setTab(newValue);
  };

  const handleChangeTabOpen = (e, newValue) => {
    setTabOpen(newValue);
  };

  const applyPanelStyle = (status) => {
    if (tabOpen !== status) {
      return { width: 0, height: 0 };
    }
  };

  const handleCloseOrOpenTicket = (ticket) => {
    setNewTicketModalOpen(false);
    if (ticket !== undefined && ticket.uuid !== undefined) {
      history.push(`/tickets/${ticket.uuid}`);
    }
  };

  const handleSelectedTags = (selecteds) => {
    const tags = selecteds.map((t) => t.id);
    setSelectedTags(tags);
  };

  const handleSelectedUsers = (selecteds) => {
    const users = selecteds.map((t) => t.id);
    setSelectedUsers(users);
  };

  return (
    <Paper elevation={0} variant="none" className={classes.ticketsRoot}>
      <NewTicketModal
        modalOpen={newTicketModalOpen}
        onClose={(ticket) => {
       
          handleCloseOrOpenTicket(ticket);
        }}
      />
      <Paper elevation={0} square>
        <div className={classes.tabsHeader}>
        <Typography variant="h6" className={classes.settingsIcon}>
          {i18n.t("tickets.title")}
        </Typography>
        </div>

        <Tabs
          value={tab}
          onChange={handleChangeTab}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
          aria-label="icon label tabs example"
          className={classes.tabsGroup}
        >
          <Tab
            value={"open"}
            label={i18n.t("tickets.tabs.open.title")}
            classes={{ root: showTabGroups ? classes.tabWithGroups : classes.tab, selected: classes.tabSelected,  }}
          />

          { showTabGroups && (
            <Tab
              value={"groups"}
              label={i18n.t("tickets.tabs.groups.title")}
              classes={{ root: classes.tabWithGroups }}
            />
          )}

          <Tab
            value={"closed"}
            label={i18n.t("tickets.tabs.closed.title")}
            classes={{ root: showTabGroups ? classes.tabWithGroups : classes.tab, selected: classes.tabSelected,  }}
          />

          <Tab
            value={"search"}
            label={i18n.t("tickets.tabs.search.title")}
            classes={{ root: showTabGroups ? classes.tabWithGroups : classes.tab, selected: classes.tabSelected,  }}
          />
        </Tabs>
      </Paper>
      <Paper square elevation={0} className={classes.ticketOptionsBox}>
        {tab === "search" ? (
          <div className={classes.serachInputWrapper}>
            <SearchIcon className={classes.searchIcon} />
            <InputBase
              className={classes.searchInput}
              inputRef={searchInputRef}
              placeholder={i18n.t("tickets.search.placeholder")}
              type="search"
              onChange={handleSearch}
            />
          </div>
        ) : (
          <>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => setNewTicketModalOpen(true)}
            >
              {i18n.t("ticketsManager.buttons.newTicket")}
            </Button>
            { tab === "open" && (
            <Can
              role={user.profile}
              perform="tickets-manager:showall"
              yes={() => (
                <FormControlLabel
                  label={i18n.t("tickets.buttons.showAll")}
                  labelPlacement="start"
                  control={
                    <Switch
                      size="small"
                      checked={showAllTickets}
                      onChange={() =>
                        setShowAllTickets((prevState) => !prevState)
                      }
                      name="showAllTickets"
                      color="primary"
                    />
                  }
                />
              )}
            />
            )}
          </>
        )}
        <TicketsQueueSelect
          style={{ marginLeft: 6 }}
          selectedQueueIds={selectedQueueIds}
          userQueues={user?.queues}
          onChange={(values) => setSelectedQueueIds(values)}
        />
      </Paper>
      <TabPanel value={tab} name="open" className={classes.ticketsWrapper}>
        <Tabs
          value={tabOpen}
          onChange={handleChangeTabOpen}
          indicatorColor="transparent"
          textColor="primary"
          className={classes.tabsSubGroup}
        >
          <Tab
            label={
              <Badge
                className={classes.badge}

                badgeContent={openCount}
                color="primary"
              >
                {i18n.t("ticketsList.assignedHeader")}
              </Badge>
            }
            classes={{ root: classes.tabSub, selected: classes.tabSubSelected, wrapper: classes.tabSubWrapper  }}
            value={"open"}
          />
          <Tab
            label={
              <Badge
                className={classes.badge}
                badgeContent={pendingCount}
                color="secondary"
              >
                {i18n.t("ticketsList.pendingHeader")}
              </Badge>
            }
            classes={{ root: classes.tabSub, selected: classes.tabSubSelected, wrapper: classes.tabSubWrapper  }}
            value={"pending"}
          />
        </Tabs>
        <Paper className={classes.ticketsWrapper}>
          <TicketsList
            status="open"
            showAll={showAllTickets}
            selectedQueueIds={selectedQueueIds}
            updateCount={(val) => setOpenCount(val)}
            style={applyPanelStyle("open")}
            setTabOpen={setTabOpen}
            showTabGroups={showTabGroups}
          />
          <TicketsList
            status="pending"
            selectedQueueIds={selectedQueueIds}
            updateCount={(val) => setPendingCount(val)}
            style={applyPanelStyle("pending")}
            setTabOpen={setTabOpen}
            showTabGroups={showTabGroups}
          />
        </Paper>
      </TabPanel>
      <TabPanel value={tab} name="closed" className={classes.ticketsWrapper}>
        <TicketsList
          status="closed"
          showAll={true}
          selectedQueueIds={selectedQueueIds}
          showTabGroups={showTabGroups}
          />
      </TabPanel>
      <TabPanel value={tab} name="groups" className={classes.ticketsWrapper}>
        <TicketsList
          groups={true}
          showAll={true}
          selectedQueueIds={selectedQueueIds}
          showTabGroups={showTabGroups}
        />
      </TabPanel>
      <TabPanel value={tab} name="search" className={classes.ticketsWrapper}>
        <TagsFilter onFiltered={handleSelectedTags} />
        {profile === "admin" && (
          <UsersFilter onFiltered={handleSelectedUsers} />
        )}
        <TicketsList
          isSearch={true}
          searchParam={searchParam}
          showAll={true}
          tags={selectedTags}
          users={selectedUsers}
          selectedQueueIds={selectedQueueIds}
          showTabGroups={showTabGroups}
        />
      </TabPanel>
    </Paper>
  );
};

export default TicketsManagerTabs;
