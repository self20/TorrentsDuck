import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { $ } from 'meteor/jquery';
import { sAlert } from 'meteor/juliancwirko:s-alert';

import Files from '../../../api/files/files';

import './filesList.html';

Template.filesList.onCreated(() => {
  const instance = Template.instance();
  instance.filesPagination = new Meteor.Pagination(Files, {
    sort: {
      createdAt: -1,
    },
  });
  instance.currentFileName = new ReactiveVar();
});

Template.filesList.helpers({
  filesPagination() {
    return Template.instance().filesPagination;
  },
  filesList() {
    return Template.instance().filesPagination.getPage();
  },
  currentFileName() {
    return Template.instance().currentFileName.get();
  },
});

Template.filesList.events({
  'click .deleteFiles'(event, templateInstance) {
    const file = this;
    templateInstance.currentFileName.set(file.name);
    $('#removeFileModal').modal({
      onApprove: () => {
        Meteor.call('deleteFiles', file._id);
        return true;
      },
    }).modal('show');
  },
  'click .reSeedTorrent'() {
    const file = this;
    Meteor.call('getTorrent', file._id, (getError, getSuccess) => {
      if (getError) sAlert.error(getError);
      if (getSuccess) {
        sAlert.warning('Torrent already in queue 😕');
        return false;
      }
      Meteor.call('startTransfer', file.torrentRef, (error, success) => {
        if (error) sAlert.error(error);
        if (success) {
          sAlert.success(`Torrent "${file.name}" restarted`);
        }
      });
      return true;
    });
    return false;
  },
  'change #perPage'(event, templateInstance) {
    templateInstance.filesPagination.perPage(Number(event.target.value));
  },
  'change #sort'(event, templateInstance) {
    const sort = {};
    sort[event.target.value] = -1;
    templateInstance.filesPagination.sort(sort);
  },
  'input #search'(event, templateInstance) {
    const filters = templateInstance.filesPagination.filters();
    if (event.target.value) {
      filters['$or'] = [
        { name: { $regex: event.target.value, '$options': 'i' } },
        { tags: { $regex: event.target.value, '$options': 'i' } },
      ];
    } else if (filters.$or) {
      delete filters.$or;
    }
    templateInstance.filesPagination.filters(filters);
  },
});
